var message = require('@mapbox/lambda-cfn').message;
var splitOnComma = require('@mapbox/lambda-cfn').splitOnComma;

module.exports.fn = function(event, context, callback) {
  if (event.detail.errorCode)
    return callback(null, event.detail.errorMessage);

  var disallowed = splitOnComma(process.env.disallowedActions);
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
