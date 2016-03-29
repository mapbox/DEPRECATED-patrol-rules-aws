var message = require('lambda-cfn').message;
var splitOnComma = require('lambda-cfn').splitOnComma;

module.exports.config = {
  name: 'cloudTrail',
  sourcePath: 'rules/cloudTrail.js',
  parameters: {
    disallowedActions: {
      Type: 'String',
      Description: 'Comma separated list of disallowed CouldTrail actions'
    }
  },
  eventRule: {
    eventPattern:{
      'detail-type': [
        'AWS API Call via CloudTrail'
      ],
      detail: {
        eventSource: [
          'cloudtrail.amazonaws.com'
        ],
        eventName: [
          'CreateTrail',
          'DeleteTrail',
          'StartLogging',
          'StopLogging',
          'UpdateTrail'
        ]
      }
    }
  }
};

module.exports.fn = function(event, callback) {
  if (event.detail.errorCode)
    return callback(null, event.detail.errorMessage);

  var disallowed = splitOnComma(process.env.disallowedActions);
  var couldTrailEvent = event.detail.eventName;

  // Check for fuzzy match
  var match = disallowed.filter(function(event) {
    return couldTrailEvent.indexOf(event) > -1;
  });

  if (match.length > 0) {
    var notif = {
      subject: 'Disallowed CloudTrail event ' + couldTrailEvent + ' called',
      summary: 'Disallowed CloudTrail event ' + couldTrailEvent + ' called',
      event: event
    };
    message(notif, function(err, result) {
      callback(err, result);
    });
  } else {
    callback(null, 'Disallowed CloudTrail event was not called');
  }
};
