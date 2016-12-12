var message = require('lambda-cfn').message;
var splitOnComma = require('lambda-cfn').splitOnComma;
var getEnv = require('lambda-cfn').getEnv;

module.exports.config = {
  name: 'cloudTrail',
  runtime: 'nodejs4.3',
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

  var disallowed = splitOnComma(getEnv('disallowedActions'));
  var cloudTrailEvent = event.detail.eventName;

  // Check for fuzzy match
  var match = disallowed.filter(function(event) {
    return cloudTrailEvent.indexOf(event) > -1;
  });

  if (match.length > 0) {
    var notif = {
      subject: 'Disallowed CloudTrail event ' + cloudTrailEvent + ' called',
      summary: 'Disallowed CloudTrail event ' + cloudTrailEvent + ' called',
      event: event
    };
    message(notif, function(err, result) {
      callback(err, result);
    });
  } else {
    callback(null, 'Disallowed CloudTrail event was not called');
  }
};
