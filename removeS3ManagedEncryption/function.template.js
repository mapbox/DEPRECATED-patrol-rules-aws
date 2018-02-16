var lambdaCfn = require('@mapbox/lambda-cfn');

module.exports = lambdaCfn.build({
  name: 'removeS3ManagedEncryption',
  eventSources: {
    cloudwatchEvent: {
      eventPattern: {
        'detail-type': [
          'AWS API Call via CloudTrail'
        ],
        detail: {
          eventSource: [
            's3.amazonaws.com'
          ],
          eventName: [
            'DeleteBucketEncryption'
          ]
        }
      }
    }
  }
});