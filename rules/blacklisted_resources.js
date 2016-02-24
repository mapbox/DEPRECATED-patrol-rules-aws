var AWS = require('aws-sdk');
var queue = require('queue-async');
var message = require('../lib/message');
var utils = require('../lib/utils');

module.exports.config = {
  name: 'blacklistedResources',
  parameters: {
    'blacklistedResourceArns': {
      'Type': 'String',
      'Description': 'Comma separated list of ARNs to blacklist. Any policy document that grants access to these ARNs will trigger a notification.',
    }
  },
  eventRule: {
    eventPattern:{
      "detail-type": [
        "AWS API Call via CloudTrail"
      ],
      "detail": {
        "eventSource": [
          "iam.amazonaws.com"
        ],
        "eventName": [
          "CreatePolicy",
          "CreatePolicyVersion",
          "PutGroupPolicy",
          "PutRolePolicy",
          "PutUserPolicy"
        ]
      }
    }
  }
};

module.exports.fn = function(event, callback) {
  if (event.detail.errorCode)
    return callback(null, event.detail.errorMessage);
  var iam = new AWS.IAM();
  var q = queue(1);

  var blacklisted = utils.splitOnComma(process.env.blacklistedResourceArns);
  var document = event.detail.requestParameters.policyDocument;
  var parsed = JSON.parse(document);

  var simulate = function(params, cb) {
    iam.simulateCustomPolicy(params, function(err, data) {
      cb(err, data);
    });
  };

  blacklisted.forEach(function(resource) {
    var resourceService = resource.split(':')[2];
    parsed.Statement.forEach(function(policy) {
      var actions = [];
      if (policy.Effect == 'Allow' && policy.Action) {
        actions = typeof policy.Action == 'string' ? [policy.Action] : policy.Action;
      }
      actions.forEach(function(action) {
        var policyService = action.split(':')[0];
        if (resourceService === policyService) {
          // A blacklisted resource's service matches one of the services in
          // a policy.  Run through simulator.
          var params = {
            ActionNames: [action],
            PolicyInputList: [document],
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
    var q = queue(1);
    if (truncated) {
      q.defer(message, {
        subject: 'Blacklisted resources rule results truncated',
        body: 'Blacklisted resources rule results were truncated. Paging ' +
            'is not currently supported.'
        }
      );
    }
    if (matches.length) {
      q.defer(message, {
        subject: 'Policy allows access to blacklisted resources',
        body: {
          subjectFull: 'Policy allows access to blacklisted resources: ' + matches.join(', '),
          event: event
        }
      });
    }
    q.awaitAll(function(err, ret) {
      callback(err, ret);
    });
  });

};
