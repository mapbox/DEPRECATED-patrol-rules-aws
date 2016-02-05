// TODO - cloudwatch alarms
// TODO - should we have a monolithic role?

module.exports.build = function(options) {

  var resources = {};
  resources[options.name] = lambdaFn(options);
  resources[options.name + 'Role'] = role(options);

  return {
    Parameters: parameters(options),
    Resources: resources
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
    }
  };

  template.Resources = {};

  parts.forEach(function(part) {

    if (part.Parameters) {
      for (var p in part.Parameters) {
        if (template.Parameters[p])
          throw new Error('Duplicate parameter key' + p);
        template.Parameters[p] = part.Parameters[p];
      }
    }

    if (part.Resources) {
      for (var r in part.Resources) {
        if (template.Resources[r])
          throw new Error('Duplicate resource key' + r);
        template.Resources[r] = part.Resources[r];
      }
    }
  });

  return JSON.stringify(template);

};

function parameters(options) {
  var p = options.parameters;
  return p;
}

function lambdaFn(options) {

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
          "LambdaRole",
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

function role(options) {

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
              }
            ]
          }
        }
      ]
    }
  };

  if (options.statements && options.statements.length) {
    var policy = {
      PolicyName: options.name,
      PolicyDocument: {
        Statement: options.statements
      }
    };
    role.Properties.Policies.push(policy);
  }

  return role;

}
