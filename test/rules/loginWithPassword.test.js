var test = require('tape');
var lambdaCfn = require('lambda-cfn');
var rule = require('../../rules/loginWithPassword');
var fn = rule.fn;

test('loginWithPassword rule - not allowed', function(t) {
  var event = {
    "eventVersion": "1.02",
    "userIdentity": {
      "type": "IAMUser",
      "principalId": "ABCDEFG",
      "arn": "arn:aws:iam::000000000000:user/rclark",
      "accountId": "000000000000",
      "userName": "rclark"
    },
    "eventTime": "2016-06-08T00:58:40Z",
    "eventSource": "signin.amazonaws.com",
    "eventName": "ConsoleLogin",
    "awsRegion": "us-east-1",
    "sourceIPAddress": "000.00.00.00",
    "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/50.0.2661.102 Safari/537.36",
    "requestParameters": null,
    "responseElements": {
      "ConsoleLogin": "Success"
    },
    "additionalEventData": {
      "LoginTo": "https://console.aws.amazon.com/cloudwatch/?&isauthcode=true",
      "MobileVersion": "No",
      "MFAUsed": "Yes"
    },
    "eventID": "c7d78bf9-a0f5-4f13-88d2-8483c6b951d9",
    "eventType": "AwsConsoleSignIn",
    "recipientAccountId": "000000000000"
  };

  t.plan(3);

  var message = lambdaCfn.message;
  lambdaCfn.message = function(params, callback) {
    t.deepEqual(params, {
      subject: 'User logged in with password',
      summary: 'User rclark logged into the console using a password',
      event: event
    }, 'expected notification was sent');
    callback();
  };

  fn(event, function(err, message) {
    t.ifError(err, 'no error message');
    t.notOk(message, 'no success message');
  });
});


test('loginWithPassword rule - allowed', function(t) {
  var event = {
    "eventVersion": "1.02",
    "userIdentity": {
      "type": "AssumedRole",
      "principalId": "HIJKLM:davidtheclark",
      "arn": "arn:aws:sts::000000000000:assumed-role/some-assumed-role/davidtheclark",
      "accountId": "000000000000",
      "sessionContext": {
        "attributes": {
          "mfaAuthenticated": "true",
          "creationDate": "2016-06-08T01:01:37Z"
        },
        "sessionIssuer": {
          "type": "Role",
          "principalId": "HIJKLM",
          "arn": "arn:aws:iam::000000000000:role/some-assumed-role",
          "accountId": "000000000000",
          "userName": "some-assumed-role"
        }
      }
    },
    "eventTime": "2016-06-08T01:01:40Z",
    "eventSource": "signin.amazonaws.com",
    "eventName": "ConsoleLogin",
    "awsRegion": "us-east-1",
    "sourceIPAddress": "000.00.00.00",
    "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/51.0.2704.79 Safari/537.36",
    "requestParameters": null,
    "responseElements": {
      "ConsoleLogin": "Success"
    },
    "additionalEventData": {
      "MobileVersion": "No",
      "MFAUsed": "No"
    },
    "eventID": "79a5ffd7-c21c-4f65-afbd-9d6d0995a1dd",
    "eventType": "AwsConsoleSignIn",
    "recipientAccountId": "000000000000"
  };

  var message = lambdaCfn.message;
  lambdaCfn.message = function(params, callback) {
    t.fail('no notification should be sent');
    callback();
  };

  fn(event, function(err, message) {
    t.ifError(err, 'no error message');
    t.equal(message, 'Valid federated login detected', 'expected success message');
    t.end();
  });
});

test('loginWithPassword rule - invalid event type', function(t) {
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

  fn(event, function(err) {
    t.equal(err.message, 'invalid event');
    t.end();
  });
});
