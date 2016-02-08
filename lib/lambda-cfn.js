// TODO - cloudwatch alarms
module.exports.build = function(options) {

  var resources = {};
  resources[options.name] = lambda(options);
  resources['StreambotEnv' + options.name] = streambotEnv(options);

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

  // Streambot

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
