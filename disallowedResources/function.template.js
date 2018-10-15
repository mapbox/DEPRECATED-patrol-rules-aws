var lambdaCfn = require('@mapbox/lambda-cfn');

module.exports = lambdaCfn.build({
  name: 'disallowedResources',
  timeout: '120',
  parameters: {
    disallowedResourceArns: {
      Type: 'String',
      Description: 'Comma separated list of ARNs to disallow. Any policy document that grants access to these ARNs will trigger a notification.'
    },
    ignoredRolePolicy: {
      Type: 'String',
      Description: 'Comma separated list of colon delimited role:policy pairs to ignore'
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
            'iam.amazonaws.com'
          ],
          eventName: [
            'CreatePolicy',
            'CreatePolicyVersion',
            'PutGroupPolicy',
            'PutRolePolicy',
            'PutUserPolicy'
          ]
        }
      }
    }
  }
});
