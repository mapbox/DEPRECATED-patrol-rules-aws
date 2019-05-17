const lambdaCfn = require('@mapbox/lambda-cfn');
const splitOnComma = require('@mapbox/lambda-cfn').splitOnComma;

module.exports.fn = function(event, context, callback) {
  if (event.detail.errorCode) return callback(null, event.detail.errorMessage);

  const requestParameters = event.detail.requestParameters;
  const accessLoggingStatus = requestParameters.BucketLoggingStatus.LoggingEnabled;

  const bucketFilter = process.env.bucketFilter ? splitOnComma(process.env.bucketFilter) : [];
  const ignore = bucketFilter.find((regex) => new RegExp(regex).test(requestParameters.bucketName));

  if (ignore) {
    callback(null, `S3 bucket ${requestParameters.bucketName} filtered, access logging change ignored`);
  } else {
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
      callback(null, 'S3 server access logging not disabled');
    }
  }
};