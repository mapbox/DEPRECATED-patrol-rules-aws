const lambdaCfn = require('@mapbox/lambda-cfn');

module.exports.fn = function(event, context, callback) {
  if (event.detail.errorCode) return callback(null, event.detail.errorMessage);

  let message = {
    subject: `Bucket encryption removed from ${event.detail.requestParameters.bucketName}`,
    summary: `AWS managed S3 encryption removed from ${event.detail.requestParameters.bucketName}`,
    event: event
  };

  lambdaCfn.message(message, (err, result) => {
    callback(err, result);
  });

};