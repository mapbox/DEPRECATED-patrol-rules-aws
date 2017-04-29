# patrol-rules-aws

[![Build Status](https://travis-ci.org/mapbox/patrol-rules-aws.svg?branch=master)](https://travis-ci.org/mapbox/patrol-rules-aws)

A set of rules implemented using [lambda-cfn](https://github.com/mapbox/lambda-cfn) and designed to run on a [patrol](https://github.com/mapbox/patrol) stack.  The rules in this repository all aim to monitor certain parts of AWS infrastructure for best practices, security, and compliance.  Read more about the patrol architecture on the [patrol project](https://github.com/mapbox/patrol).

### Usage

Follow the steps on the [patrol](https://github.com/mapbox/patrol) readme to set up your own patrol stack on AWS which makes use of the patrol-rules-aws rules.  Follow instructions on patrol on how to enable or disable particular rules, and, how to deploy on your own AWS account.

### Rules

The following rules are included with patrol-rules-aws.  Each rule is configurable, and you will be prompted to enter configuration values when creating a patrol stack as described on the patrol readme.

#### allowedIAMActions

- **Description** - Checks for any IAM policy created which grants actions to restricted services, except for certain allowed actions on those services.  For example, if you specify "iam, cloudtrail" as the restricted resources, and then specify "iam:PassRole" as an allowed action, any policy created which grants IAM actions other than "PassRole" will trigger an alarm.
- **Trigger** - API call iam:CreatePolicy, iam:CreatePolicyVersion, iam:PutGroupPolicy, iam:PutRolePolicy, iam:PutUserPolicy
- **Parameters**
  - restrictedServices - Comma separated list of services on which to disallow all actions
  - allowedActions - on the restrictedServices, only allow these actions to be granted

#### assumeRole

- **Description** - Checks for when an IAM principal assumes a disallowed role
- **Trigger** - API call sts:AssumeRole
- **Parameters**
  - disallowedRoles - Comma separated list of roles to alarm on if a user assumes said role.

#### cloudfrontModifyDelete

- **Description** - Checks for disallowed actions on restricted CloudFront distributions.
- **Trigger** - The specified API calls on the specified distributions
- **Parameters**
  - protectedActions - CloudFront API call on which to alarm
  - protectedDistributions - CloudFront distributions on which to alarm

#### cloudTrail

- **Description** - Checks for disallowed CloudTrail actions
- **Trigger** - The specified API calls
- **Parameters**
  - disallowedActions - CloudTrail API actions to alarm on if called

#### disallowedResources

- **Description** - Checks for IAM policies that allow access to disallowed resources
- **Trigger** - AWS API call
- **Parameters**
  - disallowedResourceARNs - Comma separated list of AWS ARNs.  An alarm will be triggered if an IAM policy grants any kind of access to these resources.

#### serviceLimits
- **Description** - Queries AWS Trusted Advisor for all supported service limits and the resources approaching those service limits. The utilitization threshold for Trusted Advisor service limit warnings is 80%. Please see the [list of service limits](https://aws.amazon.com/premiumsupport/ta-faqs/#service-limits-check-questions) that are supported by Trusted Advisor.
- **Trigger** - Scheduled rule every 5 minutes
- **Parameters**
  - ignoredResources - Comma separated list of AWS Trusted Advisor resourceIds to ignore. ResourceIds are most easily found using `awscli` and directly querying the support API. For example, this query will return all resourceIds for services close to their limits:
``aws support describe-trusted-advisor-check-result --check-id eW7HH0l7J9 --query 'result.flaggedResources[?status!=`ok`][resourceId,metadata[1],metadata[2],metadata[0]]' --output table --region us-east-1``

#### rootLogin
- **Description** - Checks if the root AWS user logged in to the console
- **Trigger** - AWS Console Sign-in

#### EC2 created by console
- **Description** - Checks if a EC2 is created by console
- **Trigger** - AWS API Call via CloudTrail

### Tests

To run tests, clone the repository, run `npm install` and then `npm test`.  However, in order to run the tests with `npm test`, you must have AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY set in your environment.  The "disallowedResources" tests use the AWS IAM policy simulator in their tests.
