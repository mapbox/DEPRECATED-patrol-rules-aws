var message = require('lambda-cfn').message;
var splitOnComma = require('lambda-cfn').splitOnComma;
var getEnv = require('lambda-cfn').getEnv;
var d3 = require('d3-queue');
var policyProcessor = require('../lib/policyProcessor');

module.exports.config = {
  name: 'allowedIAMActions',
  sourcePath: 'rules/allowedIAMActions.js',
  parameters: {
    restrictedServices: {
      Type: 'String',
      Description: 'Comma separated list of services to restrict'
    },
    allowedActions: {
      Type: 'String',
      Description: 'Comma separated list of actions to allow among restricted services'
    }
  },
  eventRule: {
    eventPattern: {
      'detail-type': [
        'AWS API Call via CloudTrail'
      ],
      detail: {
        eventSource: [
          'iam.amazonaws.com'
        ],
        eventName: [
          'CreatePolicy',
          'CreatePolicyVersion',
          'PutGroupPolicy',
          'PutRolePolicy',
          'PutUserPolicy'
        ]
      }
    }
  },
  scheduledRule: 'rate(60 minutes)'
};

module.exports.fn = function(event, callback) {
  var batchedPolicies;
  var q = d3.queue();
  var allowedActions = splitOnComma(getEnv('allowedActions'));
  var restrictedServices = splitOnComma(getEnv('restrictedServices'));

  if (event['detail-type'] == 'Scheduled Event') {
    //call policy processor
    policyProcessor(function(err, data) {
      batchedPolicies = data;

      //console.log("BATCHED POLICIES: " + JSON.stringify(batchedPolicies));
      for (var role in batchedPolicies) {
        for (var policy in batchedPolicies[role].policies) {
          var policyDetail = {
            roleName: role,
            policyName: policy,
            policyDocument: batchedPolicies[role].policies[policy]
          };
          q.defer(processPolicy, policyDetail);
        }
      }

      q.awaitAll(function(err, data) {
        return callback(err, data);
      });
    });
  } else if (event.detail.errorCode) {
    return callback(null, event.detail.errorMessage);
  } else {
    processPolicy(event.detail.requestParameters, function(err, data) {
      if (err) return callback(err);
      else return callback(null, data);
    });
  }

  function processPolicy(policyDetail, next) {
    var document = JSON.parse(policyDetail.policyDocument);

    // build list of actions used.
    var actions = [];
    document.Statement.forEach(function(policy) {
      if (!Array.isArray(policy.Action))
        actions.push(policy.Action);
      else
        actions = actions.concat(policy.Action);
    });

    var violations = [];
    actions.forEach(function(pair) {
      var parts = pair.split(':');
      var service = parts[0];

      // Check if a restricted service, and not on the allowed list.
      if (restrictedServices.indexOf(service) > -1 && allowedActions.indexOf(pair) < 0) {
        violations.push(pair);
      }
    });

    if (violations.length > 0) {
      var notif = {
        subject: 'Disallowed actions used in policy',
        summary: 'Disallowed actions ' + violations.join(' ') + ' used in policy'
      };
      if (batchedPolicies) {
        notif.event = policyDetail;
      } else {
        notif.event = event;
      }

      message(notif, function(err, result) {
        next(err, result);
      });
    } else {
      next(null, 'Disallowed action was not used in policy');
    }
  };
};
