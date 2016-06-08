var test = require('tape');

var rule = require('../../rules/allowedIAMActions.js');
var fn = rule.fn;
var name = rule.config.name;

test('allowedIAMActions rule', { skip: true }, function(t) {

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

  process.env.allowedActions = 'iam:PassRole';
  process.env.restrictedServices = 'iam, cloudtrail';

  fn(event, function(err, message) {
    t.equal(message.subject, 'Disallowed actions used in policy',
      'Alarms on multiple disallowed matches');
    t.equal(message.summary, 'Disallowed actions cloudtrail:* iam:* iam:PutUserPolicy used in policy',
      'Alarms on multiple disallowed matches');
  });

  var docAllowedRestricted = {
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

  event.detail.requestParameters.policyDocument = JSON.stringify(docAllowedRestricted);

  fn(event, function(err, message) {
    t.equal(message.subject, 'Disallowed actions used in policy',
      'Alarms on multiple disallowed matches');
    t.equal(message.summary, 'Disallowed actions iam:PutUserPolicy used in policy',
      'Alarms on multiple disallowed matches');
  });

  var docAllowed = {
    Statement: [
      {
        Effect: "Allow",
        Action: [
          "iam:PassRole"
        ]
      }
    ]
  };

  event.detail.requestParameters.policyDocument = JSON.stringify(docAllowed);

  fn(event, function(err, message) {
    t.equal(undefined, undefined, 'No alarm on allowed action');
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
