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
lambdaCfn.lambdaSnsTopic = lambdaSnsTopic;
lambdaCfn.lambdaSnsUser = lambdaSnsUser;
lambdaCfn.lambdaSnsUserAccessKey = lambdaSnsUserAccessKey;
lambdaCfn.outputs = outputs;

function build(options) {

  var resources = {};
  resources[options.name] = lambda(options);
  resources[options.name + 'Permission'] = lambdaPermission(options);
    resources['StreambotEnv' + options.name] = streambotEnv(options);

    if (options.snsRule) {
        // add sns and role user resource
        // add sns resource
        // add output for sns user keys
        resources[options.name + 'SNSTopic'] = lambdaSnsTopic(options);
        resources[options.name + 'SNSUser'] = lambdaSnsUser(options);
        resources[options.name + 'SNSUserAccessKey'] = lambdaSnsUserAccessKey(options);
    }

  var alarms = cloudwatch(options);
  for (var k in alarms) {
    resources[k] = alarms[k];
  }

  return {
      Parameters: parameters(options),
      Resources: resources,
      Policy: policy(options),
      Outputs: outputs(options)
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
      "MemorySize": 128,
      "Runtime": "nodejs",
      "Timeout": 60
    }
  };

  return fn;

}

function lambdaPermission(options) {
    if (!options.name) throw new Error('name property required for lambda');
    var perm = {};
  //var perm = {
    if (options.eventRule) {
        perm = {
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
    } else if (options.snsRule != undefined) {
        perm = {
            "Type": "AWS::Lambda::Permission",
            "Properties": {
                "FunctionName": {
                    "Fn::GetAtt": [
                        options.name,
                        "Arn"
                    ]
                },
                "Action": "lambda:InvokeFunction",
                "Principal": "sns.amazonaws.com",
                "SourceArn": {
                    "Ref" : options.name + 'SNSTopic'
                }
            }
        };
    }
    return perm;
};


function lambdaSnsUser(options) {
    if (!options.name) throw new Error('name property required for lambda SNS User');
    var user = {
        "Type": "AWS::IAM::User",
        "Properties": {
            "Policies": [
                {
                    "PolicyName": options.name + 'SNSTopicPolicy',
                    "PolicyDocument": {
                        "Version": "2012-10-17",
                        "Statement": [
                            {
                                "Resource": [
                                    {
                                        "Ref": options.name + "SNSTopic"
                                    }
                                ],
                                "Action": [
                                    "sns:ListTopics",
                                    "sns:Publish",
                                ],
                                "Effect": "Allow"
                            }

                        ]
                    }
                }
            ]
        }
    };
    return user;
};

function lambdaSnsUserAccessKey(options) {
    if (!options.name) throw new Error('name property required for lambda SNS User Access Key');
    var key = {
        "Type": "AWS::IAM::AccessKey",
        "Properties": {
            "UserName": {
                "Ref": options.name + "SNSUser"
            }
        }
    };
    return key;
}

function lambdaSnsTopic(options) {
    if (!options.name) throw new Error('name property required for lambda SNS Topic');
    var topic = {
        "Type": "AWS::SNS::Topic",
        "Properties": {
            "DisplayName": {
                "Fn::Join": [
                    "-",
                    [
                        {
                            "Ref": "AWS::StackName"
                        },
                        options.name
                    ]
                ]
            },
            "TopicName": {
                "Fn::Join": [
                    "-",
                    [
                        {
                            "Ref": "AWS::StackName"
                        },
                        options.name
                    ]
                ]
            },
            "Subscription": [
                {
                    "Endpoint": {
                        "Fn::GetAtt": [
                            options.name,
                            "Arn"
                        ]
                    },
                    "Protocol": "lambda"
                }
            ]
        }
    };
    return topic;
};

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
          },
          {
              "Sid": "",
              "Effect": "Allow",
              "Principal": {
                  "Service": "sns.amazonaws.com"
              },
              "Action": "sts:AssumeRole"
          },

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
              },
                {
                    "Effect": "Allow",
                    "Action": [
                        "sns:Publish",
                        "sns:ListTopics"
                    ],
                    "Resource": {
                        "Fn::Join": [
                            "",
                            [
                                "arn:aws:sns:us-east-1:",
                                {
                                    "Ref":"AWS::AccountId"
                                },
                                ":",
                                {
                                    "Ref":"AWS::StackName"
                                },
                                "*"
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

function outputs(options) {
    if (!options.snsRule) return;
    //output access and secret
    if (!options.name) throw new Error('name property required for template outputs');
    var outputs = {};
    outputs[options.name + 'SNSUserAccessKey'] = {
        "Value": {
            "Ref": options.name + 'SNSUserAccessKey'
        }
    };
    outputs[options.name + 'SNSUserSecretAccessKey'] = {
        "Value": {
            "Fn::GetAtt": [
                options.name + 'SNSUserAccessKey',
                "SecretAccessKey"
            ]
        }
    };

    return outputs;

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
