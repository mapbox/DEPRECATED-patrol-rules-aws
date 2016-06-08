var AWS = require('aws-sdk');
var d3 = require('d3-queue');
var message = require('lambda-cfn').message;
var splitOnComma = require('lambda-cfn').splitOnComma;
var getEnv = require('lambda-cfn').getEnv;
var policyProcessor = require('../lib/policyProcessor');
var util =  require('util');

module.exports.config = {
  name: 'disallowedResources',
  sourcePath: 'rules/disallowedResources.js',
  parameters: {
    disallowedResourceArns: {
      Type: 'String',
      Description: 'Comma separated list of ARNs to disallow. Any policy document that grants access to these ARNs will trigger a notification.'
    }
  },
  eventRule: {
    eventPattern:{
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
  scheduledRule: 'rate(120 minutes)'
};

module.exports.fn = function(event, callback) {
  var iam = new AWS.IAM();
  var q = d3.queue();
  var batchedPolicies;
  var disallowedResources = splitOnComma(getEnv('disallowedResourceArns'));

  function onlyUnique(value, index, self) {
    return self.indexOf(value) === index;
  };

  //var document = event.detail.requestParameters.policyDocument;
  //var parsed = JSON.parse(document);
  //console.log(event);
  if (event['detail-type'] == 'Scheduled Event') {
    //call policy processor
    policyProcessor(function(err, data) {
      batchedPolicies = data;

      //console.log(JSON.stringify(batchedPolicies));
      for (var role in batchedPolicies) {
        for (var policy in batchedPolicies[role].policies) {
          var policyDetail = {
            roleName: role,
            policyName: policy,
            policyDocument: batchedPolicies[role].policies[policy]
          };
          if (policyDetail.policyDocument) {
            q.defer(processPolicy, policyDetail);
          } else {
            console.log('ERROR:%s:%s', policyDetail.roleName, policyDetail.policyName);
          }
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
    var q = d3.queue(1);
    var simulate = function(params, cb) {
      iam.simulateCustomPolicy(params, function(err, data) {
        cb(err, data);
      });
    };

    // try {
    var parsed = JSON.parse(policyDetail.policyDocument);

    // } catch(e) {
    //   console.log(util.format('Error %s parsing %s',e,policyDetail.policyDocument));
    // }

    disallowedResources.forEach(function(resource) {
      var resourceService = resource.split(':')[2];
      parsed.Statement.forEach(function(policy) {
        //console.log(policy);
        var actions = [];
        if (policy.Effect == 'Allow' && policy.Action) {
          actions = typeof policy.Action == 'string' ? [policy.Action] : policy.Action;
        }

        //console.log(actions);
        actions.forEach(function(action) {
          var policyService = action.split(':')[0];
          if (resourceService === policyService) {
            // A disallowed resource's service matches one of the services in
            // a policy.  Run through simulator.
            var params = {
              ActionNames: [action],
              PolicyInputList: [policyDetail.policyDocument],
              ResourceArns: [resource]
            };
            q.defer(simulate, params);
          }
        });
      });
    });

    q.awaitAll(function(err, data) {
      if (err) return callback(err);
      var matches = [];
      var truncated = false;
      data.forEach(function(response) {
        // Warn on truncation.  Build paging support if this is hit.
        if (response.IsTruncated) truncated = true;
        response.EvaluationResults.forEach(function(result) {
          if (result.EvalDecision === 'allowed') {
            matches.push(result.EvalResourceName);
          }
        });
      });

      // Report
      var q = d3.queue(1);
      if (truncated) {
        q.defer(message, {
          subject: 'Disallowed resources rule results truncated',
          summary: 'Disallowed resources rule results were truncated. Paging ' +
            'is not currently supported.'
        });
      }

      if (matches.length) {

        var summaryMatches = matches.filter(onlyUnique);

        var notif = {
          subject: 'Policy allows access to disallowed resources',
          summary: 'Policy allows access to disallowed resources: ' + summaryMatches.join(', ')
        };
        if (batchedPolicies) {
          notif.event = policyDetail;
        } else {
          notif.event = event;
        }

        q.defer(message, notif);
      }

      q.awaitAll(function(err, ret) {
        callback(err, ret);
      });
    });
  };
};
