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
  process.env.blacklistedResources = 'arn:aws:s3:::foo/bar/baz, arn:aws:s3:::foo/bar';

  fn(event, function(err, message) {
    t.deepEqual(message, [], 'No matched blacklisted resources');
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
  process.env.blacklistedResources = 'arn:aws:s3:::foo/bar/baz, arn:aws:s3:::foo/bar';

  fn(event, function(err, message) {
    t.equal(message.length, 1, 'There is only one result');
    t.equal(message[0].subject,
      'Policy allows access to blacklisted resources: arn:aws:s3:::foo/bar/baz, arn:aws:s3:::foo/bar',
      'No matched blacklisted resources');
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
  process.env.blacklistedResources = 'arn:aws:s3:::foo/bar/baz, arn:aws:s3:::foo/bar';

  fn(event, function(err, message) {
    t.equal(message.length, 1, 'There is only one result');
    t.equal(message[0].subject,
      'Policy allows access to blacklisted resources: arn:aws:s3:::foo/bar/baz, arn:aws:s3:::foo/bar',
      'No matched blacklisted resources');
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
  process.env.blacklistedResources = 'arn:aws:s3:::foo/bar/baz, arn:aws:s3:::foo/bar';

  fn(event, function(err, message) {
    t.equal(message.length, 1, 'There is only one result');
    t.equal(message[0].subject,
      'Policy allows access to blacklisted resources: arn:aws:s3:::foo/bar/baz, arn:aws:s3:::foo/bar',
      'No matched blacklisted resources');
  });

  t.end();

});
