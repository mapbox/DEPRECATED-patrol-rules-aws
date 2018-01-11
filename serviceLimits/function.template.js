const lambdaCfn = require('@mapbox/lambda-cfn');

module.exports = lambdaCfn.build({
  name: 'ServiceLimits',
  eventSources: {
    cloudwatchEvent: {
      eventPattern: {
        'detail-type': [
          'Trusted Advisor Check Item Refresh Notification'
        ],
        detail: {
          eventSource: [
            'aws.trustedadvisor'
          ],
          eventName: [
            'Service Limits'
          ]
        }
      }
    }
  }
});