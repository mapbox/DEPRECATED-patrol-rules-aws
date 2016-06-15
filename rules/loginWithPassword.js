var lambdaCfn = require('lambda-cfn');

module.exports.config = {
  name: 'loginWithPassword',
  sourcePath: 'rules/loginWithPassword.js',
  eventPattern:{
    'detail-type': [
      'AWS API Call via CloudTrail'
    ],
    detail: {
      eventSource: [
        'signin.amazonaws.com'
      ],
      eventName: [
        'ConsoleLogin'
      ]
    }
  }
};

// An invalid login (with a password) will lack session context and will have used MFA
module.exports.fn = function(event, callback) {
  var identity = event.userIdentity;
  if (!identity) return callback(new Error('invalid event'));
  var session = identity.sessionContext;

  var additional = event.additionalEventData;
  if (!additional) return callback(new Error('invalid event'));
  var withMfa = additional.MFAUsed;

  if (!session && additional.MFAUsed === 'Yes') {
    lambdaCfn.message({
      subject: 'User logged in with password',
      summary: 'User ' + identity.userName + ' logged into the console using a password',
      event: event
    }, callback);
  } else {
    callback(null, 'Valid federated login detected');
  }
};
