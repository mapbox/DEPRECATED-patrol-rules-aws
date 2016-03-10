var lambdaCfn = require('lambda-cfn');

module.exports = lambdaCfn(
  [
    'rules/assumeRole.js',
    'rules/blacklisted_resources.js',
    'rules/cloudfrontModifyDelete.js',
    'rules/cloudTrail.js',
    'rules/whitelisted_iam_actions.js'
  ],
  {
    "AWSTemplateFormatVersion": "2010-09-09",
    "Description": "crowsnest"
  }
);
