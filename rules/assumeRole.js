var message = require('lambda-cfn').message;
var splitOnComma = require('lambda-cfn').splitOnComma;
var getEnv = require('lambda-cfn').getEnv;

module.exports.config = {
  name: 'assumeRole',
  sourcePath: 'rules/assumeRole.js',
  parameters: {
    disallowedRoles: {
      Type: 'String',
      Description: 'Comma separated list of disallowed roles'
    }
  },
  eventRule: {
    eventPattern: {
      'detail-type': [
        'AWS API Call via CloudTrail'
      ],
      detail: {
        eventSource: [
          'sts.amazonaws.com'
        ],
        eventName: [
          'AssumeRole'
        ]
      }
    }
  }
};

module.exports.fn = function(event, callback) {
  if (event.detail.errorCode)
    return callback(null, event.detail.errorMessage);
  var disallowed = splitOnComma(getEnv('disallowedRoles'));
  var assumedRoleArn = event.detail.requestParameters.roleArn;
  var userName = event.detail.userIdentity.userName;

  // Check for fuzzy match
  var match = disallowed.filter(function(role) {
    return assumedRoleArn.indexOf(role) > -1;
  });

  if (match.length > 0) {
    var notif = {
      subject: 'Disallowed role ' + match[0]  + ' assumed',
      summary: 'Disallowed role ' + match[0]  + ' assumed by ' + userName,
      event: event
    };
    message(notif, function(err, result) {
      callback(err, result);
    });
  } else {
    callback(null, 'Disallowed role was not assumed');
  }
};
