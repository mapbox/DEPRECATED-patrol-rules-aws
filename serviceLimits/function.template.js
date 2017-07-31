var lambdaCfn = require('@mapbox/lambda-cfn');

module.exports = lambdaCfn.build({
  name: 'serviceLimits',
  parameters: {
    ignoredResources: {
      Type: 'String',
      Description: 'Comma separated list of ignored resourceIds for limit warnings'
    }
  },
  statements: [
    {
      Effect: 'Allow',
      Action: [
        'support:*'
      ],
      Resource: '*'
    }
  ],
  eventSources: {
    schedule: {
      expression: 'rate(5 minutes)'
    }
  }
});
