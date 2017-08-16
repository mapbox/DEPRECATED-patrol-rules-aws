var lambdaCfn = require('@mapbox/lambda-cfn');

module.exports = lambdaCfn.build({
  name: 'assumeRole',
  parameters: {
    disallowedRoles: {
      Type: 'String',
      Description: 'Comma separated list of disallowed roles'
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
            'sts.amazonaws.com'
          ],
          eventName: [
            'AssumeRole'
          ]
        }
      }
    }
  }
});
