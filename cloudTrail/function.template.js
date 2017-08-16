var lambdaCfn = require('@mapbox/lambda-cfn');

module.exports = lambdaCfn.build({
  name: 'cloudTrail',
  parameters: {
    disallowedActions: {
      Type: 'String',
      Description: 'Comma separated list of disallowed CloudTrail actions'
    }
  },
  eventSources: {
    cloudwatchEvent: {
      eventPattern:{
        'detail-type': [
          'AWS API Call via CloudTrail'
        ],
        detail: {
          eventSource: [
            'cloudtrail.amazonaws.com'
          ],
          eventName: [
            'CreateTrail',
            'DeleteTrail',
            'StartLogging',
            'StopLogging',
            'UpdateTrail'
          ]
        }
      }
    }
  }
});
