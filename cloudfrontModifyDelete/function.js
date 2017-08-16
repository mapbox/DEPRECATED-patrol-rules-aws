var message = require('@mapbox/lambda-cfn').message;
var splitOnComma = require('@mapbox/lambda-cfn').splitOnComma;

module.exports.fn = function(event, context, callback) {
  if (event.detail.errorCode)
    return callback(null, event.detail.errorMessage);

  var protectedActions = splitOnComma(process.env.protectedActions);
  var protectedDistributions = splitOnComma(process.env.protectedDistributions);
  var eventDistribution = event.detail.requestParameters.id;
  var eventName = event.detail.eventName;

  // Check for fuzzy match for protected CloudFront distributions
  var distributionMatch = protectedDistributions.filter(function(distribution) {
    return eventDistribution.indexOf(distribution) > -1;
  });

  if (distributionMatch.length > 0) {

    // Check for fuzzy match for protected CloudFront event names
    var eventsMatch = protectedActions.filter(function(event) {
      return eventName.indexOf(event) > -1;
    });

    if (eventsMatch.length > 0) {
      var notif = {
        subject: eventName + ' called on protected CloudFront distribution ' + eventDistribution,
        summary: eventName + ' called on protected CloudFront distribution ' + eventDistribution,
        event: event
      };
      message(notif, function(err, result) {
        callback(err, result);
      });
    } else {
      callback(null, 'Protected CloudFront event was not called');
    }

  } else {
    callback(null, 'Protected CloudFront distribution was not updated');
  }
};
