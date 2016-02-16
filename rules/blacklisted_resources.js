var AWS = require('aws-sdk');
var queue = require('queue-async');
var message = require('../lib/message');

module.exports.config = {
  name: 'blacklistedResources',
  parameters: {
    'blacklistedResources': {
      'Type': 'String',
      'Description': 'Comma separated list of blacklisted resources',
    }
  }
};

module.exports.fn = function(event, callback) {

  var iam = new AWS.IAM();
  var q = queue(1);
  var blacklisted = module.exports.splitOnComma(process.env.blacklistedResources);
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
      var notActions = [];
      if (policy.Effect == 'Allow' && policy.Action) {
        actions = typeof policy.Action == 'string' ? [policy.Action] : policy.Action;
      }
      if (policy.Effect == 'Deny' && policy.NotAction) {
        notActions = typeof policy.NotAction == 'string' ? [policy.NotAction] : policy.NotAction;
      }
      actions = actions.concat(notActions);
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

/*
    var notif = {
      subject: 'Blacklisted role ' + match[0]  + ' assumed',
      body: 'Blacklisted role ' + match[0] + ' assumed by ' + userName
    };
    message(notif, function(err, result) {
      callback(err, result);
    });

{ ResponseMetadata: { RequestId: '3ccfd957-d468-11e5-adff-adc2befee9dd' },
  EvaluationResults: 
   [ { EvalActionName: 's3:*',
       EvalResourceName: 'arn:aws:s3:::foo/bar/baz',
       EvalDecision: 'implicitDeny',
       MatchedStatements: [],
       MissingContextValues: [],
       ResourceSpecificResults: [] } ],
  IsTruncated: false }

*/

  q.awaitAll(function(err, data) {
    if (err) return callback(err);
    data.forEach(function(response) {
      // Warn on truncation.  Build paging support if this is hit.
      if (response.IsTruncated) {
        message({
          subject: 'Blacklisted resources rule results truncated',
          body: 'Blacklisted resources rule results were truncated. Paging ' +
            'is not currently supported.'
        }, function(err, res) {
            callback(err, res);
        });
      }
      var matches = [];
      response.EvaluationResults.forEach(function(result) {
        if (result.EvalDecision === 'allowed') {
          matches.push(result.EvalResourceName);
        }
      });
      message({
        subject: 'Policy allows access to blacklisted resources: ' + matches.join(', '),
        body: JSON.stringify(event)
      }, function(err, res) {

      });
    });
  });

};

module.exports.splitOnComma = function(str) {
  return str.split(/\s*,\s*/);
};
