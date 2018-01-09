const message = require('@mapbox/lambda-cfn').message;
const splitOnComma = require('@mapbox/lambda-cfn').splitOnComma;

module.exports.fn = (event, context, callback) => {
  if (event.detail.errorCode) return callback(null, event.detail.errorMessage);

  let disallowed = splitOnComma(process.env.disallowedActions);
  let cloudTrailEvent = event.detail.eventName;

  // Check for fuzzy match
  let match = disallowed.filter((event) => {
    return cloudTrailEvent.indexOf(event) > -1;
  });

  if (match.length > 0) {
    let notif = {
      subject: 'Disallowed CloudTrail event ' + cloudTrailEvent + ' called',
      summary: 'Disallowed CloudTrail event ' + cloudTrailEvent + ' called',
      event: event
    };
    message(notif, (err, result) => {
      callback(err, result);
    });
  } else {
    callback(null, 'Disallowed CloudTrail event was not called');
  }
};
