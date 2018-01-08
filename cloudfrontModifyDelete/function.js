const message = require('@mapbox/lambda-cfn').message;
const splitOnComma = require('@mapbox/lambda-cfn').splitOnComma;

module.exports.fn = (event, context, callback) => {
  if (event.detail.errorCode) return callback(null, event.detail.errorMessage);

  let protectedActions = splitOnComma(process.env.protectedActions);
  let protectedDistributions = splitOnComma(process.env.protectedDistributions);
  let eventDistribution = event.detail.requestParameters.id;
  let eventName = event.detail.eventName;

  // Check for fuzzy match for protected CloudFront distributions
  let distributionMatch = protectedDistributions.filter((distribution) => {
    return eventDistribution.indexOf(distribution) > -1;
  });

  if (distributionMatch.length > 0) {

    // Check for fuzzy match for protected CloudFront event names
    let eventsMatch = protectedActions.filter(function(event) {
      return eventName.indexOf(event) > -1;
    });

    if (eventsMatch.length > 0) {
      let notif = {
        subject: eventName + ' called on protected CloudFront distribution ' + eventDistribution,
        summary: eventName + ' called on protected CloudFront distribution ' + eventDistribution,
        event: event
      };
      message(notif, (err, result) => {
        callback(err, result);
      });
    } else {
      callback(null, 'Protected CloudFront event was not called');
    }
  } else {
    callback(null, 'Protected CloudFront distribution was not updated');
  }
};
