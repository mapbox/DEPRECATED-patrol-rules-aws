var lambdaCfn = require('@mapbox/lambda-cfn');

module.exports = lambdaCfn.build({
  name: 'rootLogin',
  eventSources:{
    cloudwatchEvent: {
      eventPattern: {
        'detail-type': [
          'AWS Console Sign In via CloudTrail'
        ],
        detail: {
          eventSource: [
            'signin.amazonaws.com'
          ],
          eventName: [
            'ConsoleLogin'
          ]
        }
      }
    }
  }
});
