const lambdaCfn = require('@mapbox/lambda-cfn');

module.exports = lambdaCfn.build({
  name: 'removeS3ManagedEncryption',
  parameters: {
    bucketFilter: {
      Type: 'String',
      Description: 'Comma separated list of bucket names or name patterns the rule will ignore'
    }
  },
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