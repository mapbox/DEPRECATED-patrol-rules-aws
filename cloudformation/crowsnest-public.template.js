var lambdaCfn = require('lambda-cfn');

module.exports = lambdaCfn(
  [
    'rules/assumeRole.js',
    'rules/blacklistedResources.js',
    'rules/cloudfrontModifyDelete.js',
    'rules/cloudTrail.js',
    'rules/whitelistedIAMActions.js'
  ],
  {
    "AWSTemplateFormatVersion": "2010-09-09",
    "Description": "crowsnest"
  }
);
