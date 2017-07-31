var AWS = require('aws-sdk');
var d3 = require('d3-queue');
var message = require('@mapbox/lambda-cfn').message;
var splitOnComma = require('@mapbox/lambda-cfn').splitOnComma;

module.exports.fn = function(event, context, callback) {
  if (event.detail.errorCode)
    return callback(null, event.detail.errorMessage);
  var iam = new AWS.IAM();
  var q = d3.queue(1);

  var disallowedResources = splitOnComma(process.env.disallowedResourceArns);
  var document = event.detail.requestParameters.policyDocument;
  var parsed = JSON.parse(document);

  var simulate = function(params, cb) {
    iam.simulateCustomPolicy(params, function(err, data) {
      cb(err, data);
    });
  };

  disallowedResources.forEach(function(resource) {
    var resourceService = resource.split(':')[2];
    parsed.Statement.forEach(function(policy) {
      var actions = [];
      if (policy.Effect == 'Allow' && policy.Action) {
        actions = typeof policy.Action == 'string' ? [policy.Action] : policy.Action;
      }

      actions.forEach(function(action) {
        var policyService = action.split(':')[0];
        if (resourceService === policyService) {
          // A disallowed resource's service matches one of the services in
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
    var q = d3.queue(1);
    if (truncated) {
      q.defer(message, {
        subject: 'Disallowed resources rule results truncated',
        summary: 'Disallowed resources rule results were truncated. Paging ' +
          'is not currently supported.'
      });
    }

    if (matches.length) {
      q.defer(message, {
        subject: 'Policy allows access to disallowed resources',
        summary: 'Policy allows access to disallowed resources: ' + matches.join(', '),
        event: event
      });
    }

    q.awaitAll(function(err, ret) {
      callback(err, ret);
    });
  });
};
