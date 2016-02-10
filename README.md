# crowsnest-public

This repo will be made public and renamed to crowsnest.

# Synopsis

The goal of Crowsnest is to make it easy to define and deploy AWS Lambda functions, as well as offer a base set of Lambda functions aimed at security and best practice monitoring.

# How does it make it easy

- Mechanism to quickly define CloudFormation templating for a Lambda function
- Pass configuration to Lambda functions as CloudFormation parameters.  Uses [streambot](https://github.com/mapbox/streambot)
- Define basic CloudWatch alarms
- Define a base IAM role and let you add additional policy statements to it
- Build a single CloudFormation template and deploy it with `cfn-config`

# How to use

The workflow for using Crowsnest is:

- Define functions in the ./rules directory, following the spec. below.
- Use the `build` command to wrap these functions into a CloudFormation template
- Upload the package / lambda functions to a designated S3 location
- Deploy the CloudFormation template

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

See ./examples for an example config and fn.


## Build the template

`node build.js > myCfnTemplate.template`

## Upload the package

Create a .zip of the repo, exclude .git, and upload to the path formed by:

- CodeS3Bucket + CodeS3Prefix + GitSha + .zip

## Deploy as CloudFormation stack

- Deploy with [cfn-config](https://github.com/mapbox/cfn-config)

# TODO

- Make this README less cryptic / assume reader knows less / Mapboxisms
