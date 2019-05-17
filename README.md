# patrol-rules-aws

[![Build Status](https://travis-ci.org/mapbox/patrol-rules-aws.svg?branch=master)](https://travis-ci.org/mapbox/patrol-rules-aws)

A set of functions implemented using [lambda-cfn](https://github.com/mapbox/lambda-cfn) to monitor an organization's AWS infrastructure for best practices, security and compliance. Part of the Mapbox [Patrol](https://github.com/mapbox/patrol) security framework.

### Deploying

Please see the [lambda-cfn README](https://github.com/mapbox/lambda-cfn)

### Functions

The following functions are included with patrol-rules-aws.  Each rule is configurable, and you will be prompted to enter configuration values when deploying the function with `lambda-cfn`.

#### allowedIAMActions

- **Description** - Checks for any IAM policy created which grants actions to restricted services, except for certain allowed actions on those services.  For example, if you specify "iam, cloudtrail" as the restricted resources, and then specify "iam:PassRole" as an allowed action, any policy created which grants IAM actions other than "PassRole" will trigger an alarm.
- **Trigger** - API call iam:CreatePolicy, iam:CreatePolicyVersion, iam:PutGroupPolicy, iam:PutRolePolicy, iam:PutUserPolicy
- **Parameters**
  - restrictedServices - Comma separated list of services on which to disallow all actions
  - allowedActions - on the restrictedServices, only allow these actions to be granted
  - ignoredRolePolicy - Comma separated list of colon delimited role:policy combinations that should be ignored if matched. The "role:policy" values are case-insensitively matched against the policy event.

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
- **Note** - If a Dispatch SNS Arn is provided, this alarm defaults to the Dispatch fallback channel by passing an empty slackId to Dispatch.

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
  - ignoredRolePolicy - Comma separated list of colon delimited role:policy combinations that should be ignored if matched. The "role:policy" values are case-insensitively matched against the policy event.

#### removeS3AccessLogging

- **Description** - Checks for removing server access logging from an S3 bucket
- **Trigger** - `PutBucketLogging` AWS API call
- **Parameters**
  - bucketFilter - Comma separated list of bucket names or name patterns the rule will ignore.

#### removeS3ManagedEncryption

- **Description** - Checks for removing encryption from an S3 bucket.
- **Trigger** - `DeleteBucketEncryption` AWS API call
- **Parameters**
  - bucketFilter - Comma separated list of bucket names or name patterns the rule will ignore.

#### rootLogin
- **Description** - Checks if the root AWS user logged in to the console
- **Trigger** - AWS Console Sign-in

#### publicBucketACL
- **Description** - Checks if a bucket has Public Access.
- **Trigger** - AWS API Call via CloudTrail

#### serviceLimits
- **Description** - Checks for Service Limit events which does not have status equal to "OK".
- **Trigger** - Trusted Advisor Check Item Refresh Notification

#### principalPolicySimulator
- **Description** - WIP, beta quality and super noisy. Uses the `simulatePrincipalPolicy` functionality to report on policies created or updated which give the calling IAM Principal evalated access beyond their assign iAM policies. For example, if a user has access to create Cloudformation stacks, the user can start a stack with policies giving the stack (and therefore the user) access to resources the user would not have if they directly accessed them.
- **Trigger** - API call iam:CreatePolicy, iam:CreatePolicyVersion, iam:PutGroupPolicy, iam:PutRolePolicy, iam:PutUserPolicy
- **Parameters**
  - `principalRegex` - only Principals matching this regex will be testsed
  - `ignoredServices` - a comma separated list of AWS service prefixes to skip when testing. For example, to skip policies for Cloudwatch logs and ECS: `logs,ecs`
  - `ignoredResources` - Not implemented, a comma separated list of AWS resources to skip during testing.

### Contributing

Please see [CONTRIBUTING.md](CONTRIBUTING.md)
