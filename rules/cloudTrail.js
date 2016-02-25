var message = require('../lib/message');
var utils = require('../lib/utils');

module.exports.config = {
  name: 'cloudTrail',
  parameters: {
    'blacklistedEvents': {
      'Type': 'String',
      'Description': 'Comma separated list of blacklisted CouldTrail event names',
    }
  },
  eventRule: {
    eventPattern:{
      "detail-type": [
        "AWS API Call via CloudTrail"
      ],
      "detail": {
        "eventSource": [
          "cloudtrail.amazonaws.com"
        ],
      "eventName": [
        "CreateTrail",
        "DeleteTrail",
        "StartLogging",
        "StopLogging",
        "UpdateTrail"
      ]
      }
    }
  }
};

module.exports.fn = function(event, callback) {
  if (event.detail.errorCode)
    return callback(null, event.detail.errorMessage);

  var blacklisted = utils.splitOnComma(process.env.blacklistedEvents);
  var couldTrailEvent = event.detail.eventName;
  //var cloudTrailARN = event.detail.requestParameters.name;

  // Check for fuzzy match
  var match = blacklisted.filter(function(event) {
    return couldTrailEvent.indexOf(event) > -1;
  });

  if (match.length > 0) {
    var notif = {
      subject: 'Blacklisted CloudTrail event ' + couldTrailEvent + ' called',
      summary: 'Blacklisted CloudTrail event ' + couldTrailEvent + ' called',
      event: event
    };
    message(notif, function(err, result) {
      callback(err, result);
    });
  } else {
    callback(null, 'Blacklisted CloudTrail event was not called');
  }
};
