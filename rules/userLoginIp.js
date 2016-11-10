var lcfn = require('lambda-cfn');
var geoip = require('geoip-country-lite');
var splitOnComma = require('lambda-cfn').splitOnComma;
var getEnv = require('lambda-cfn').getEnv;
var message = lcfn.message;
module.exports = {};

module.exports.config = {
  name: 'userLoginIp',
  parameters: {
    allowedCountries: {
      Type: 'String',
      Description: 'Comma separated list of allowed countries'
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
  var geo = geoip.lookup(event.sourceIPAddress);
  var offices = splitOnComma(getEnv('allowedCountries'));
  if (offices.indexOf(geo.country) > -1) {
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