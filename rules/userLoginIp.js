var lcfn = require('lambda-cfn');
var geoip = require('geoip-country-lite');
var message = lcfn.message;
module.exports = {};

module.exports.config = {
  name: 'userLoginIp',
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

var offices = {
  US: true,
  IN: true,
  DE: true,
  CN: true,
  PE: true
};

module.exports.fn = function(event, callback) {
  var geo = geoip.lookup(event.sourceIPAddress);
  if (offices[geo.country]) {
    callback(null, 'nothing happen');
  } else {
    var notification = {
      subject: 'sign in from unknown country.',
      summary: 'Patrol detected that a AWS user logged in to the console from unknown country.',
      event: event
    };
    message(notification, function(err, result) {
      callback(err, result);
    });
  }
};
