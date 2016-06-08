var message = require('lambda-cfn').message;
var splitOnComma = require('lambda-cfn').splitOnComma;
var getEnv = require('lambda-cfn').getEnv;

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
  }
};

module.exports.fn = function(event, callback) {
  if (event.detail.errorCode)
    return callback(null, event.detail.errorMessage);

  var allowedActions = splitOnComma(getEnv('allowedActions'));
  var document = JSON.parse(event.detail.requestParameters.policyDocument);
  var restrictedServices = splitOnComma(getEnv('restrictedServices'));

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
      summary: 'Disallowed actions ' + violations.join(' ') + ' used in policy',
      event: event
    };
    message(notif, function(err, result) {
      callback(err, result);
    });
  } else {
    callback(null, 'Disallowed action was not used in policy');
  }

};
