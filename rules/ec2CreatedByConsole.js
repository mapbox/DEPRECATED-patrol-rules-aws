var message = require('lambda-cfn').message;

module.exports.config = {
  name: 'ec2CreatedByConsole',
  sourcePath: 'rules/ec2CreatedByConsole.js',
  eventRule: {
    eventPattern: {
      'detail-type': [
        'AWS Console Sign In via CloudTrail'
      ],
      detail: {
        eventSource: [
          'AWS API Call via CloudTrail'
        ],
        eventName: [
          'RunInstances'
        ]
      }
    }
  }
};

module.exports.fn = function(event, callback) {
  var notification = {
    subject: 'User created instance EC2 by console.',
    summary: 'Patrol detected that the user created instance by console',
    event: event
  };

  if (event.eventName === 'RunInstances' && event.userAgent === 'signin.amazonaws.com') {
    message(notification, function(err, result) {
      callback(err, result);
    });
  } else {
    callback(null, 'Not problem');

  }
};
