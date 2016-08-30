var message = require('lambda-cfn').message;

module.exports.config = {
  name: 'rootLogin',
  sourcePath: 'rules/alertNewUser.js',
  eventRule: {
    eventPattern: {
      'detail-type': [
        'AWS Create User via CloudTrail'
      ],
      detail: {
        eventSource: [
          'iam.amazonaws.com'
        ],
        eventName: [
          'CreateUser'
        ]
      }
    }
  }
};

module.exports.fn = function(event, callback) {
  if (event.eventName === 'CreateUser') {
    var notification = {
      subject: 'New user was created',
      summary: 'Patrol detected that was created, userName:' + event.requestParameters.userName,
      event: event
    };
    message(notification, function(err, result) {
      callback(err, result);
    });
  } else {
    callback(null, 'Nothing happen');
  }
};
