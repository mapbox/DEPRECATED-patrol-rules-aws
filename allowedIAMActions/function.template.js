var lambdaCfn = require('@mapbox/lambda-cfn');

module.exports = lambdaCfn.build({
  name: 'allowedIAMActions',
  parameters: {
    restrictedServices: {
      Type: 'String',
      Description: 'Comma separated list of services to restrict'
    },
    allowedActions: {
      Type: 'String',
      Description: 'Comma separated list of actions to allow among restricted services'
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
