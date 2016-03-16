var lambdaCfn = module.exports;
module.exports.build = build;
lambdaCfn.compile = compile;
lambdaCfn.parameters = parameters;
lambdaCfn.lambda = lambda;
lambdaCfn.lambdaPermission = lambdaPermission;
lambdaCfn.role = role;
lambdaCfn.policy = policy;
lambdaCfn.streambotEnv = streambotEnv;
lambdaCfn.cloudwatch = cloudwatch;
lambdaCfn.snsTopic = snsTopic;

function build(options) {

  var resources = {};
  resources[options.name] = lambda(options);
  resources[options.name + 'Permission'] = lambdaPermission(options);
  resources['StreambotEnv' + options.name] = streambotEnv(options);

  var alarms = cloudwatch(options);
  for (var k in alarms) {
    resources[k] = alarms[k];
  }

  return {
    Parameters: parameters(options),
    Resources: resources,
    Policy: policy(options)
  };
}

function compile(parts) {
  if (!Array.isArray(parts)) throw new Error('parts must be an array');
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
  template.Resources.CrowsnestAlarmSNSTopic = snsTopic();

  return JSON.stringify(template, null, '  ') + '\n';

}

function parameters(options) {
  for (var p in options.parameters) {
    if (!options.parameters[p].Type)
      throw new Error('Parameter must contain Type property');
    if (!options.parameters[p].Description)
      throw new Error('Parameter must contain Description property');
  }
  return options.parameters;
}

function lambda(options) {
  if (!options.name) throw new Error('name property required for lambda');
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
        "Handler": "index." + options.name,
        "MemorySize": (options.memorySize ? options.memorySize : 128),
        "Runtime": (options.runtime ? options.runtime : "nodejs"),
        "Timeout": (options.timeout ? options.timeout : 60)
    }
  };

  return fn;

}

function lambdaPermission(options) {
  if (!options.name) throw new Error('name property required for lambda');

  var perm = {
    "Type": "AWS::Lambda::Permission",
    "Properties": {
      "FunctionName": {
        "Fn::GetAtt": [
          options.name,
          "Arn"
        ]
      },
      "Action": "lambda:InvokeFunction",
      "Principal": "events.amazonaws.com",
      "SourceArn": {
        "Fn::Join": [
          "",
          [
            "arn:aws:events:",
            {
              "Ref": "AWS::Region"
            },
            ":",
            {
              "Ref": "AWS::AccountId"
            },
            ":rule/",
            {
              "Ref": "AWS::StackName"
            },
            "*"
          ]
        ]
      }
    }
  };

  return perm;

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
          },
          {
            "Sid": "",
            "Effect": "Allow",
            "Principal": {
              "Service": "events.amazonaws.com"
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
              },
              {
                "Effect": "Allow",
                "Action": [
                  "sns:Publish"
                ],
                "Resource": {
                  "Ref": "CrowsnestAlarmSNSTopic"
                }
              },
              {
                "Effect": "Allow",
                "Action": [
                  "iam:SimulateCustomPolicy"
                ],
                "Resource": "*"
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
  if (!options.statements) return;
  if (!options.name)
    throw new Error('name property required for policy');
  if (options.statements && !Array.isArray(options.statements))
    throw new Error('options.statements must be an array');

  // Very basic validation on each policy statement
  options.statements.forEach(function(statement) {
    if (!statement.Effect)
      throw new Error('statement must contain Effect');
    if (!statement.Resource && !statement.NotResource)
      throw new Error('statement must contain Resource or NotResource');
    if (!statement.Action && !statement.NotAction)
      throw new Error('statement must contain Action or NotAction');
  });

  var policy = {
    PolicyName: options.name,
    PolicyDocument: {
      Statement: options.statements
    }
  };

  return policy;

}

function streambotEnv(options) {
  if (!options.name)
    throw new Error('name property required for streambotEnv');

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

    var p = !options.parameters ? {} :
      JSON.parse(JSON.stringify(options.parameters));

    // make some global env vars available
    p.CrowsnestAlarmSNSTopic = true;

    for (var k in p) {
      env.Properties[k] = { Ref: k };
    }

    return env;

}

function cloudwatch(options) {
  if (!options.name) throw new Error('name property required for cloudwatch');

  var alarms = {};

  var defaultAlarms = [
    {
      AlarmName: 'Errors',
      MetricName: 'Errors',
      ComparisonOperator: 'GreaterThanThreshold'
    },
    {
      AlarmName: 'NoInvocations',
      MetricName: 'Invocations',
      ComparisonOperator: 'LessThanThreshold'
    }
  ];

  defaultAlarms.forEach(function(alarm) {
    alarms[options.name + 'Alarm' + alarm.AlarmName] = {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "EvaluationPeriods": "5",
        "Statistic": "Sum",
        "Threshold": "0",
        "AlarmDescription": "https://github.com/mapbox/crowsnest-public/blob/master/alarms.md#" + alarm.AlarmName,
        "Period": "60",
        "AlarmActions": [
          {
            "Ref": "CrowsnestAlarmSNSTopic"
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
        "ComparisonOperator": alarm.ComparisonOperator,
        "MetricName": alarm.MetricName
      }
    };

  });

  return alarms;

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
