const AWS = require('aws-sdk');
const d3 = require('d3-queue');
const message = require('@mapbox/lambda-cfn').message;
const splitOnComma = require('@mapbox/lambda-cfn').splitOnComma;

module.exports.fn = (event, context, callback) => {
  if (event.detail.errorCode) return callback(null, event.detail.errorMessage);
  let iam = new AWS.IAM();
  let q = d3.queue(1);

  let disallowedResources = splitOnComma(process.env.disallowedResourceArns);
  let document = event.detail.requestParameters.policyDocument;
  let parsed = JSON.parse(document);

  let simulate = function(params, cb) {
    iam.simulateCustomPolicy(params, (err, data) => {
      cb(err, data);
    });
  };

  disallowedResources.forEach((resource) => {
    if (Array.isArray(parsed.Statement)) {
      parsed.Statement.forEach((policy) => {
        policyProcessor(policy, resource);
      });
    } else {
      policyProcessor(parsed.Statement, resource);
    }
  });

  function policyProcessor(policy, resource) {
    let resourceService = resource.split(':')[2];
    let actions = [];
    if (policy.Effect === 'Allow' && policy.Action) {
      actions = typeof policy.Action === 'string' ? [policy.Action] : policy.Action;
    }

    actions.forEach(function(action) {
      let policyService = action.split(':')[0];
      if (resourceService === policyService) {
        // A disallowed resource's service matches one of the services in
        // a policy.  Run through simulator.
        let params = {
          ActionNames: [action],
          PolicyInputList: [document],
          ResourceArns: [resource]
        };
        q.defer(simulate, params);
      }
    });
  }

  q.awaitAll(function(err, data) {
    if (err) return callback(err);
    let matches = [];
    let truncated = false;
    data.forEach(function(response) {
      // Warn on truncation.  Build paging support if this is hit.
      if (response.IsTruncated) truncated = true;
      response.EvaluationResults.forEach((result) => {
        if (result.EvalDecision === 'allowed') {
          matches.push(result.EvalResourceName);
        }
      });
    });

    // Report
    let q = d3.queue(1);
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

    q.awaitAll((err, ret) => {
      callback(err, ret);
    });
  });
};
