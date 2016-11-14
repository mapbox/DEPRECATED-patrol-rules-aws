var message = require('lambda-cfn').message;

module.exports.config = {
  name: 'ec2CreatedByConsole',
  sourcePath: 'rules/ec2CreatedByConsole.js',
  eventRule: {
    eventPattern: {
      'detail-type': [
        'AWS API Call via CloudTrail'
      ],
      detail: {
        eventSource: [
          'ec2.amazonaws.com'
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
    subject: event.userIdentity.userName + ' created an EC2 instance from the console',
    summary: 'Patrol detected that the user created instance by console',
    event: event
  };

  if (event.userAgent === 'cloudformation.amazonaws.com' || event.userAgent === 'autoscaling.amazonaws.com') {
    callback(null, 'EC2 was not created from console');
  } else {
    message(notification, function(err, result) {
      callback(err, result);
    });
  }
};
