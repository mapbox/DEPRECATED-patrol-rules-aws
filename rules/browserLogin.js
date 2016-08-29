var message = require('lambda-cfn').message;
var request = require('request');
var d3 = require('d3-queue');

module.exports.config = {
  name: 'browserLogin',
  sourcePath: 'rules/browserLogin.js',
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
          'signin.amazonaws.com'
        ],
        eventName: [
          'ConsoleLogin'
        ]
      }
    }
  }
};
module.exports.fn = function(event, callback) {
  var options = {
    method: 'POST',
    uri: 'https://api.whatismybrowser.com/api/v1/user_agent_parse',
    form: {
      user_agent: event.userAgent,
      user_key: 'ec971a9760752fd60b415cc2d023041b'
    }
  };
  request(options, function(error, response, body) {
    var q = d3.queue(1);

    if (!error && response.statusCode == 200) {
      if (body.version_check.is_up_to_date == false) {
        q.defer(message, {
          subject: 'Login from out of date browser',
          summary: 'Patrol detected that the user logged from an out of date browser',
          event: event
        });
      } else {
        q.defer(message, {
          subject: 'Login from up to date browser',
          summary: 'Patrol detected that the user logged from an up to date browser'
        });
      }
    }

    q.awaitAll(function(error, ret) {
      callback(error, ret);
    });

  });
};
