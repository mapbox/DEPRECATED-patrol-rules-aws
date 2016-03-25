var message = require('lambda-cfn').message;
var splitOnComma = require('lambda-cfn').splitOnComma;

module.exports.config = {
  name: 'whitelistedIAMActions',
  sourcePath: 'rules/whitelistedIAMActions.js',
  parameters: {
    blacklistedServices: {
      Type: 'String',
      Description: 'Comma separated list of services to blacklist'
    },
    whitelistedActions: {
      Type: 'String',
      Description: 'Comma separated list of actions to whitelist among the blacklisted services'
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
  }
};

module.exports.fn = function(event, callback) {
  if (event.detail.errorCode)
    return callback(null, event.detail.errorMessage);

  var whitelisted = splitOnComma(process.env.whitelistedActions);
  var document = JSON.parse(event.detail.requestParameters.policyDocument);
  var blacklistedServices = splitOnComma(process.env.blacklistedServices);

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

    // Check if a blacklisted service, and not on the whitelist
    if (blacklistedServices.indexOf(service) > -1 && whitelisted.indexOf(pair) < 0) {
      violations.push(pair);
    }
  });

  if (violations.length > 0) {
    var notif = {
      subject: 'Blacklisted actions used in policy',
      summary: 'Blacklisted actions ' + violations.join(' ') + ' used in policy',
      event: event
    };
    message(notif, function(err, result) {
      callback(err, result);
    });
  } else {
    callback(null, 'Blacklisted action was not used in policy');
  }

};
