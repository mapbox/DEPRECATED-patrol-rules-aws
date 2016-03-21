# Crowsnest

Crowsnest is a rule-based security and monitoring framework leveraging AWS Lambda to support CloudWatch Events, scheduled and SNS based rules. The goal of Crowsnest is to simplify the creation and maintenance of security alerts across a wide variety of services such as AWS and Github. It is Nodejs based, and currently only supports  rule logic written in javascript.

## Core technologies
- [AWS Lambda](http://docs.aws.amazon.com/lambda/latest/dg/welcome.html)
- [AWS CloudWatch Events](http://docs.aws.amazon.com/AmazonCloudWatch/latest/DeveloperGuide/WhatIsCloudWatchEvents.html)
- [AWS Cloudformation](http://aws.amazon.com/documentation/cloudformation/?icmpid=docs_menu_internal)
- [AWS SNS](http://docs.aws.amazon.com/sns/latest/dg/welcome.html)
- [Nodejs](https://nodejs.org/en/)
- [Streambot](https://github.com/mapbox/streambot)
- [cfn-config](https://github.com/mapbox/cfn-config/)

## Supported rule types
- **AWS CloudWatch Events:** triggered when AWS resources tranisition state or when AWS API calls are made.
- **Scheduled:** periodically trigger the Lambda.
- **SNS:** subscribe the Lambda to an SNS queue.

## How does Crowsnest help create and manage rule sets?

- Creates and maintains the CloudFormation template for the Crowsnest Lambda function
- Using Streambot, Cloudformation parameters are passed to Lambda functions.
- Creates and maintains Cloudwatch alarms for lambda invocation errors and no invocations.
- Defines a default, expandable base IAM role for Lambda.
- Builds a single CloudFormation template for deployment with `cfn-config`

## How to use

The workflow for using Crowsnest is:

- Define functions in the ./rules directory, following the spec. below.
- Use the `bin/crowsnest-build.js` command to wrap these functions into a CloudFormation template
- Upload the package / lambda functions to a designated S3 location
- Deploy the CloudFormation template
- Build and deploy the CloudWatch Event rules with `bin/crowsnest-rules.js`

## Define functions

Rules are a .js file in ./rules which:

- export a function which will be run on AWS Lambda.  The function should be exported to `module.exports.fn`
  - first param is `event`
  - second param is `callback`
  - call `callback` in standard node.js style when the function is done (callback(err, message))
- define configuration as an object, exported to `module.exports.config`
  - `name` string name of what you call your function.
  - `parameters` lets you pass configuration to the specific Lambda function.  Theses parameters become parameters on the CloudFormation template, and environment variables within the Lambda function when it runs.
  - `statements` an array of IAM policy statements which will be added to the IAM role your Lambda function runs as.
  - `eventRule` an object which contains an `eventPattern` object
    - `eventPattern` an object which contains a CloudWatch Event Rule [Event Pattern](http://docs.aws.amazon.com/AmazonCloudWatch/latest/DeveloperGuide/CloudWatchEventsandEventPatterns.html)

See ./examples for an example config and fn.


## Build the template

`node bin/crowsnest-build.js > myCfnTemplate.template`

## Upload the package

Create a .zip of the repo, exclude .git, and upload to the path formed by:

- CodeS3Bucket + CodeS3Prefix + GitSha + .zip

## Deploy as CloudFormation stack

- Deploy with [cfn-config](https://github.com/mapbox/cfn-config)

## Create rules

`node bin/crowsnest-rules.js` will create CloudWatch Event Rules and lambda targets for each rule in `./rules`, so long as that rule specifies an eventRule.eventPattern object

## Additional documentation
- [Known limitations and workarounds](limitations-workarounds.md)
- Service architecture diagram
- Troubleshooting and diagnosis

# TODO

- Make this README less cryptic / assume reader knows less / Mapboxisms
