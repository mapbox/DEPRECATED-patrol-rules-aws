module.exports.build = function(options) {

  var resources = {};
  resources[options.name] = lambda(options);
  resources['StreambotEnv' + options.name] = streambotEnv(options);
  resources[options.name + 'ErrorsAlarm'] = cloudwatch(options, 'errors');
  resources[options.name + 'NoInvocationsAlarm'] = cloudwatch(options, 'noInvocations');

  return {
    Parameters: parameters(options),
    Resources: resources,
    Policy: policy(options)
  };
};

module.exports.compile = function(parts) {

  var template = {
    "AWSTemplateFormatVersion": "2010-09-09",
    "Description": "Crowsnest"
  };

  template.Parameters = {
    CodeS3Bucket: {
      Type: 'String',
      Description: 'lambda function S3 bucket location'
    },
    CodeS3Prefix: {
      Type: 'String',
      Description: 'lambda function S3 prefix location'
    },
    GitSha: {
      Type: 'String',
      Description: 'lambda function S3 prefix location'
    },
    StreambotEnv: {
      Type: 'String',
      Description: 'StreambotEnv lambda function ARN'
    },
    AlarmEmail: {
      Type: 'String',
      Description: 'Alarm notifications will send to this email address'
    }
  };

  template.Resources = {};

  parts.forEach(function(part) {
    // Parameters
    if (part.Parameters) {
      for (var p in part.Parameters) {
        if (template.Parameters[p])
          throw new Error('Duplicate parameter key' + p);
        template.Parameters[p] = part.Parameters[p];
      }
    }

    // Resources
    if (part.Resources) {
      for (var r in part.Resources) {
        if (template.Resources[r])
          throw new Error('Duplicate resource key' + r);
        template.Resources[r] = part.Resources[r];
      }
    }

    // Monolithic role
    var roleStub = role();
    if (part.Policy)
      roleStub.Properties.Policies.push(part.Policy);
    template.Resources.CrowsnestRole = roleStub;

  });

  // Alarm SNS topic
  template.Resources.AlarmSNSTopic = snsTopic();

  return JSON.stringify(template, null, '  ');

};

function parameters(options) {
  var p = options.parameters;
  return p;
}

function lambda(options) {

  var fn = {
    "Type": "AWS::Lambda::Function",
    "Properties": {
      "Code": {
        "S3Bucket": {
          "Ref": "CodeS3Bucket"
        },
        "S3Key": {
          "Fn::Join": [
            "",
            [
              {
                "Ref": "CodeS3Prefix"
              },
              {
                "Ref": "GitSha"
              },
              ".zip"
            ]
          ]
        }
      },
      "Role": {
        "Fn::GetAtt": [
          "CrowsnestRole",
          "Arn"
        ]
      },
      "Description": {
        "Ref": "AWS::StackName"
      },
      "Handler": "index.handler",
      "MemorySize": 128,
      "Runtime": "nodejs",
      "Timeout": 60
    }
  };

  // TODO make timeout, memory configurable.
  fn.Properties.Handler = "index." + options.name;

  return fn;

}

function role() {

  var role = {
    "Type": "AWS::IAM::Role",
    "Properties": {
      "AssumeRolePolicyDocument": {
        "Statement": [
          {
            "Sid": "",
            "Effect": "Allow",
            "Principal": {
              "Service": "lambda.amazonaws.com"
            },
            "Action": "sts:AssumeRole"
          }
        ]
      },
      "Path": "/",
      "Policies": [
        {
          "PolicyName": "basic",
          "PolicyDocument": {
            "Statement": [
              {
                "Effect": "Allow",
                "Action": [
                  "logs:*"
                ],
                "Resource": "arn:aws:logs:*:*:*"
              },
              {
                "Effect": "Allow",
                "Action": [
                  "dynamodb:GetItem"
                ],
                "Resource": {
                  "Fn::Join": [
                    "",
                    [
                      "arn:aws:dynamodb:us-east-1:",
                      {
                        "Ref": "AWS::AccountId"
                      },
                      ":table/streambot-env*"
                    ]
                  ]
                }
              }
            ]
          }
        }
      ]
    }
  };

  return role;

}

function policy(options) {

  if (options.statements) {
    var policy = {
      PolicyName: options.name,
      PolicyDocument: {
        Statement: options.statements
      }
    };

    return policy;

  }
}

function streambotEnv(options) {

  if (options.parameters) {

    var env = {
      "Type": "Custom::StreambotEnv",
      "Properties": {
        "ServiceToken": {
          "Ref": "StreambotEnv"
        },
        "FunctionName": {
          "Ref": options.name
        }
      }
    };

    var p = options.parameters;
    for (var k in p) {
      env.Properties[k] = { Ref: k };
    }

    return env;

  }

}

function cloudwatch(options, type) {
  if (type == 'errors') {
    return {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "EvaluationPeriods": "5",
        "Statistic": "Sum",
        "Threshold": "0",
        "AlarmDescription": "https://github.com/mapbox/crowsnest-public/blob/master/alarms.md#errors",
        "Period": "60",
        "AlarmActions": [
          {
            "Ref": "AlarmSNSTopic"
          }
        ],
        "InsufficientDataActions": [
          {
            "Ref": "AlarmSNSTopic"
          }
        ],
        "Namespace": "AWS/Lambda",
        "Dimensions": [
          {
            "Name": "FunctionName",
            "Value": {
              "Ref": options.name
            }
          }
        ],
        "ComparisonOperator": "GreaterThanThreshold",
        "MetricName": "Errors"
      }
    };
  } else if (type == 'noInvocations') {
    return {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "EvaluationPeriods": "5",
        "Statistic": "Sum",
        "Threshold": "0",
        "AlarmDescription": "https://github.com/mapbox/crowsnest-public/blob/master/alarms.md#noinvocations",
        "Period": "60",
        "AlarmActions": [
          {
            "Ref": "AlarmSNSTopic"
          }
        ],
        "InsufficientDataActions": [
          {
            "Ref": "AlarmSNSTopic"
          }
        ],
        "Namespace": "AWS/Lambda",
        "Dimensions": [
          {
            "Name": "FunctionName",
            "Value": {
              "Ref": options.name
            }
          }
        ],
        "ComparisonOperator": "LessThanThreshold",
        "MetricName": "Invocations"
      }
    };
  }

}

function snsTopic(options) {
  return {
    "Type": "AWS::SNS::Topic",
    "Properties": {
      "TopicName": {
        "Ref": "AWS::StackName"
      },
      "Subscription": [
        {
          "Endpoint": {
            "Ref": "AlarmEmail"
          },
          "Protocol": "email"
        }
      ]
    }
  };
}
