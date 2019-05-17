const lambdaCfn = require('@mapbox/lambda-cfn');
const splitOnComma = require('@mapbox/lambda-cfn').splitOnComma;

module.exports.fn = function(event, context, callback) {
  if (event.detail.errorCode) return callback(null, event.detail.errorMessage);

  const bucketFilter = process.env.bucketFilter ? splitOnComma(process.env.bucketFilter) : [];
  const ignore = bucketFilter.find((regex) => new RegExp(regex).test(event.detail.requestParameters.bucketName));

  if (ignore) {
    callback(null, `S3 bucket ${event.detail.requestParameters.bucketName} filtered, encryption change ignored`);
  } else {
    const message = {
      subject: `Bucket encryption removed from ${event.detail.requestParameters.bucketName}`,
      summary: `AWS managed S3 encryption removed from ${event.detail.requestParameters.bucketName}`,
      event: event
    };

    lambdaCfn.message(message, (err, result) => {
      callback(err, result);
    });
  }
};