var test = require('tape');

var rule = require('../../rules/blacklisted_resources.js');
var fn = rule.fn;
var name = rule.config.name;

test('blacklisted_resources rule', function(t) {

  var event = {
    "detail": {
      "userIdentity": {
        "userName": "bob",
      },
      "requestParameters": {
        "roleArn": "arn:aws:iam::12345678901:role/Administrator-123456",
        "roleSessionName": "bob"
      }
    }
  };

  var docMixed = {
    Statement: [
      {
        Effect: "Allow",
        Action: [
          "cloudtrail:*"
        ]
      },
      {
        Effect: "Allow",
        Action: [
          "iam:*"
        ]
      },
      {
        Effect: "Allow",
        Action: [
          "s3:*"
        ],
        Resource: [
          "arn:aws:s3:::eggs"
        ]
      },
      {
        Effect: "Allow",
        Action: [
          "kinesis:*",
          "s3:DeleteObject"
        ],
        Resource: "arn:aws:s3:::paper"
      },
      {
        Effect: "Allow",
        Action: [
          "iam:PutRolePolicy"
        ],
        Resource: "*"
      },
    ]
  };

  event.detail.requestParameters.policyDocument = JSON.stringify(docMixed);

  process.env.blacklistedResources = 'arn:aws:s3:::foo/bar/baz, arn:aws:s3:::foo/bar';

  fn(event, function(err, message) {

  });

  t.end();

});
