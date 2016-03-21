# Limitations and workarounds

1. **Streambot**: Currently CloudFormation parameters cannot be passed to an AWS Lambda function. Streambot provides a consistent interface to load and retrieve CloudFormation parameters into an AWS Lambda function. ETA for native CFN parameter Lambda support is unknown. https://github.com/mapbox/streambot
2. **Accessing the Lambda context runtime within a Streambot'ed lambda:** The Streambot function wrapper handles the Lambda context runtime, allowing the wrapped function to use the standard nodejs style callback `(err,result)`. Streambot exposes the Lamdba context to the wrapped function by binding it to `this`, see https://github.com/mapbox/streambot/pull/36
2. **CloudWatch Event Rules:** There is currently no CloudFormation support for CloudWatch Event Rules. The creation of the rules is handled separately by `crowsnest-rules.js` using the AWS SDK.
3. **Scheduled Lambdas:** CloudFormation has no support for scheduling Lambdas, which rely on CloudWatch Event Rules for the trigger. Subscribing lambdas to schedules is handled by `crowsnest-rules.js` which uses the AWS SDK.
4. **Scheduled rules limited to a resolution of 5 min:** This is a limitation of the CloudWatch Events Rule schedule expression. See http://docs.aws.amazon.com/AmazonCloudWatch/latest/DeveloperGuide/ScheduledEvents.html 
5. **Scheduled rule schedule expression not validated:** Due to the complexity of validating the schedule expression used by CloudWatch Events Rules, no attempt is made to validate schedule expressions in rule definitions before creating the CloudFormation template. Typically, invalid expressions will rollback the template updates but leave the stack in a usable state.
4. **Lambda SNS Subscription API call undocumented:** AWS support has confirmed the SNS documentation is missing Lambda as a supported protocol (http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/SNS.html#subscribe-property).
Example code:

```javascript
var AWS = require('aws-sdk');
AWS.config.region = "us-east-1";

var sns = new AWS.SNS();
var topicArn = 'EXAMPLE_SNS_ARN'
var protocol = 'lambda'
var endpoint = 'EXAMPLE_LAMBDA_ARN'

// Create a subscription
var params = {
  Protocol: protocol, /* required */
  TopicArn: topicArn, /* required */
  Endpoint: endpoint
};

sns.subscribe(params, function(err, data) {
  if (err) console.log(err, err.stack); // an error occurred
  else     console.log(data);           // successful response
});
```


