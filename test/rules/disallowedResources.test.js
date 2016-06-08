var test = require('tape');

var rule = require('../../rules/disallowedResources.js');
var fn = rule.fn;
var name = rule.config.name;

test('disallowedResources rule', { skip: true }, function(t) {

  t.plan(18);

  process.env.disallowedResourceArns = 'arn:aws:s3:::foo/bar/baz, arn:aws:s3:::foo/bar';

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

  var docNoMatch = {
    Statement: [
      {
        Effect: "Allow",
        Action: [
          "cloudtrail:*"
        ]
      },
    ]
  };

  event.detail.requestParameters.policyDocument = JSON.stringify(docNoMatch);

  fn(event, function(err, message) {
    t.error(err, 'No error when calling ' + name);
    t.deepEqual(message, [], 'No matched disallowed resources');
  });

  var docMatch = {
    Statement: [
      {
        Effect: "Allow",
        Action: [
          "s3:*"
        ],
        Resource: [
          "*"
        ]
      },
    ]
  };

  event.detail.requestParameters.policyDocument = JSON.stringify(docMatch);

  fn(event, function(err, message) {
    t.equal(message.length, 1, 'There is only one result');
    t.equal(message[0].subject,
      'Policy allows access to disallowed resources',
      'Matches disallowed resources');
    t.equal(message[0].summary,
      'Policy allows access to disallowed resources: arn:aws:s3:::foo/bar/baz, arn:aws:s3:::foo/bar',
      'summary lists matched disallowed resources');
  });

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
          "s3:*"
        ],
        Resource: [
          "*"
        ]
      }
    ]
  };

  event.detail.requestParameters.policyDocument = JSON.stringify(docMixed);

  fn(event, function(err, message) {
    t.equal(message.length, 1, 'There is only one result');
    t.equal(message[0].subject,
      'Policy allows access to disallowed resources',
      'No matched disallowed resources');
    t.equal(message[0].summary,
      'Policy allows access to disallowed resources: arn:aws:s3:::foo/bar/baz, arn:aws:s3:::foo/bar',
      'subjectFull lists matched disallowed resources');
  });

  var docFuzzyMatch = {
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
          "s3:*"
        ],
        Resource: [
          "arn:aws:s3:::fo*"
        ]
      }
    ]
  };

  event.detail.requestParameters.policyDocument = JSON.stringify(docFuzzyMatch);

  fn(event, function(err, message) {
    t.equal(message.length, 1, 'There is only one result');
    t.equal(message[0].subject,
      'Policy allows access to disallowed resources',
      'Matches fuzzy match S3 disallowed resources');
  });

  var docKinesisMatch = {
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
          "kinesis:*"
        ],
        Resource: [
          "arn:aws:kinesis:us-east-1:123456789012:stream/*-bar-*"
        ]
      }
    ]
  };

  event.detail.requestParameters.policyDocument = JSON.stringify(docKinesisMatch);
  process.env.disallowedResourceArns = 'arn:aws:kinesis:us-east-1:123456789012:stream/foo-bar-KinesisStream-ABC*, arn:aws:s3:::foo/bar';

  fn(event, function(err, message) {
    t.equal(message.length, 1, 'There is only one result');
    t.equal(message[0].subject,
      'Policy allows access to disallowed resources',
      'Matches kinesis disallowed resources');
    t.equal(message[0].summary,
      'Policy allows access to disallowed resources: arn:aws:kinesis:us-east-1:123456789012:stream/foo-bar-KinesisStream-ABC*',
      'subjectFull lists matched disallowed resources');
  });

  var docTwoMatches = {
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
          "kinesis:*"
        ],
        Resource: [
          "arn:aws:kinesis:us-east-1:123456789012:stream/foo*"
        ]
      },
      {
        Effect: "Allow",
        Action: [
          "s3:*"
        ],
        Resource: [
          "*"
        ]
      }
    ]
  };

  event.detail.requestParameters.policyDocument = JSON.stringify(docTwoMatches);
  process.env.disallowedResourceArns = 'arn:aws:kinesis:us-east-1:123456789012:stream/foo-bar-KinesisStream-ABC*, arn:aws:s3:::foo/bar';

  fn(event, function(err, message) {
    t.equal(message.length, 1, 'There is only one result');
    t.equal(message[0].subject,
      'Policy allows access to disallowed resources',
      'Matches kinesis and s3 disallowed resources');
    t.equal(message[0].summary,
      'Policy allows access to disallowed resources: arn:aws:kinesis:us-east-1:123456789012:stream/foo-bar-KinesisStream-ABC*, arn:aws:s3:::foo/bar',
      'subjectFull lists matched disallowed resources');
  });

  var event = {
    "detail": {
      errorCode: "AccessDenied",
      errorMessage: "This is the error message"
    }
  };

  fn(event, function(err, message) {
    t.error(err, 'No error when calling ' + name);
    t.equal(message, 'This is the error message',
      'errorMessage is returned in callback');
  });

});
