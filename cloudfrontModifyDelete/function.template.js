var lambdaCfn = require('@mapbox/lambda-cfn');

module.exports = lambdaCfn.build({
  name: 'cloudfrontModifyDelete',
  parameters: {
    protectedActions: {
      Type: 'String',
      Description: 'Comma separated list of protected CloudFront API actions'
    },
    protectedDistributions: {
      Type: 'String',
      Description: 'Comma separated list of protected CloudFront distributions'
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
            'cloudfront.amazonaws.com'
          ],
          eventName: [
            'UpdateDistribution',
            'DeleteDistribution',
            'UpdateDistribution2016_01_28',
            'DeleteDistribution2016_01_28'
          ]
        }
      }
    }
  }
});
