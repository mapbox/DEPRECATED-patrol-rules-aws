var test = require('tape');

var rule = require('../../rules/whitelisted_iam_actions.js');
var fn = rule.fn;
var name = rule.config.name;

test('whitelisted_iam_actions rule', function(t) {

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
          "ec2:*"
        ]
      },
      {
        Effect: "Allow",
        Action: [
          "iam:PutUserPolicy"
        ]
      },
    ]
  };

  event.detail.requestParameters.policyDocument = JSON.stringify(docMixed);

  process.env.whitelistedActions = 'iam:PassRole';
  process.env.blacklistedServices = 'iam, cloudtrail';

  fn(event, function(err, message) {
    t.equal(message.subject, 'Blacklisted actions cloudtrail:* iam:* ec2:* iam:PutUserPolicy used in policy',
      'Alarms on multiple blacklist matches');
  });

  var docWhitelistedBlacklisted = {
    Statement: [
      {
        Effect: "Allow",
        Action: [
          "iam:PassRole"
        ]
      },
      {
        Effect: "Allow",
        Action: [
          "iam:PutUserPolicy"
        ]
      },
    ]
  };

  event.detail.requestParameters.policyDocument = JSON.stringify(docWhitelistedBlacklisted);

  fn(event, function(err, message) {
    t.equal(message.subject, 'Blacklisted actions iam:PutUserPolicy used in policy',
      'Alarms on multiple blacklist matches');
  });

  var docWhitelisted = {
    Statement: [
      {
        Effect: "Allow",
        Action: [
          "iam:PassRole"
        ]
      }
    ]
  };

  event.detail.requestParameters.policyDocument = JSON.stringify(docWhitelisted);

  fn(event, function(err, message) {
    t.equal(undefined, undefined, 'No alarm on whitelisted action');
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

  t.end();

});
