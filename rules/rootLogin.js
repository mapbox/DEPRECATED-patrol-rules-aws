var message = require('lambda-cfn').message;

module.exports.config = {
  name: 'rootLogin',
  runtime: 'nodejs4.3',
  sourcePath: 'rules/rootLogin.js',
  eventRule: {
    eventPattern: {
      'detail-type': [
        'AWS Console Sign In via CloudTrail'
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
  }
};

module.exports.fn = function(event, context, callback) {
  if (event.detail.errorCode)
    return callback(null, event.detail.errorMessage);

  if (event.detail.userIdentity.userName === 'root') {
    var notif = {
      subject: 'Root user logged into the console.',
      summary: 'Patrol detected that the root AWS user logged into the console',
      event: event
    };
    message(notif, function(err, result) {
      callback(err, result);
    });
  } else {
    callback(null, event.detail.userIdentity.userName + ' user logged into the console.');
  }
};
