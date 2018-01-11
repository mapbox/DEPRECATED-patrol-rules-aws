const lambdaCfn = require('@mapbox/lambda-cfn');
const util = require('util');

module.exports.fn = (event, context, callback) => {
  if (event.detail.errorCode) return callback(null, event.detail.errorMessage);
  if (event.status !== 'OK') {
    return notify(event, callback);
  }
  callback(null, 'No Service Limit Warning or Error');
};

function notify(event, callback) {
  let message = {
    subject: util.format('Service Limit %s for %s in %s', event.status, event.detail['check-name'], event.region),
    summary: JSON.stringify(event, null, 4),
    event: event
  };

  lambdaCfn.message(message, (err, result) => {
    callback(err, result);
  });
}