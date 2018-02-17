const lambdaCfn = require('@mapbox/lambda-cfn');

module.exports.fn = function(event, context, callback) {
  if (event.detail.errorCode) return callback(null, event.detail.errorMessage);

  const requestParameters = event.detail.requestParameters;
  const accessLoggingStatus = requestParameters.BucketLoggingStatus.LoggingEnabled;

  if (accessLoggingStatus === undefined) {
    const message = {
      subject: `S3 server access logging removed from ${requestParameters.bucketName}`,
      summary: `S3 server access logging removed from ${requestParameters.bucketName}`,
      event: event
    };
    lambdaCfn.message(message, (err, result) => {
      callback(err, result);
    });
  } else {
    callback(null, 'S3 server access logging not disabled.');
  }

};