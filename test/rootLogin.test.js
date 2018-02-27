var test = require('tape');

var rule = require('../rootLogin/function.js');

test('Detects root login correctly', function(t) {
  rule.fn(rootLoginEvent, {}, function(err, message) {
    t.error(err, 'does not error');
    t.equal(message.subject, 'Root user logged into the console.', 'Detected root user login');
    t.end();
  });
});

test('Detects any user login', function(t) {
  rule.fn(testUserLoginEvent, {}, function(err, message) {
    t.error(err, 'does not error');
    t.equal(message, 'testUser user logged into the console.', 'Detected testUser user login');
    t.end();
  });
});

var rootLoginEvent = {
  'detail': {
    'eventVersion': '1.02',
    'userIdentity': {
      'type': 'Root',
      'principalId': 'AIDAEZ7VBM6PDZEXAMPLE',
      'arn': 'arn:aws:iam::12345679012:user/root',
      'accountId': '12345679012',
    },
    'eventTime': '2014-07-08T17:36:03Z',
    'eventSource': 'signin.amazonaws.com',
    'eventName': 'ConsoleLogin',
    'awsRegion': 'us-east-1',
    'sourceIPAddress': '192.0.2.0',
    'userAgent': 'Mozilla/5.0 (Windows; U; Windows NT 5.0; en-US; rv:1.4b) Gecko/20030516 Mozilla Firebird/0.6',
    'requestParameters': null,
    'responseElements': {
      'ConsoleLogin': 'Success'
    },
    'additionalEventData': {
      'MobileVersion': 'Yes',
      'LoginTo': 'https://console.aws.amazon.com/sns',
      'MFAUsed': 'Yes'
    },
    'eventID': '5d2c2f55-3d1e-4336-b940-dbf8e66f588c',
    'eventType': 'AwsConsoleSignIn'
  }
};

var testUserLoginEvent = {
  'detail': {
    'eventVersion': '1.02',
    'userIdentity': {
      'type': 'AssumedRole',
      'principalId': 'AIDAEZ7VBM6PDZEXAMPLE',
      'arn': 'arn:aws:iam::12345679012:user/testUser',
      'accountId': '12345679012',
      'userName': 'testUser'
    },
    'eventTime': '2014-07-08T17:36:03Z',
    'eventSource': 'signin.amazonaws.com',
    'eventName': 'ConsoleLogin',
    'awsRegion': 'us-east-1',
    'sourceIPAddress': '192.0.2.0',
    'userAgent': 'Mozilla/5.0 (Windows; U; Windows NT 5.0; en-US; rv:1.4b) Gecko/20030516 Mozilla Firebird/0.6',
    'requestParameters': null,
    'responseElements': {
      'ConsoleLogin': 'Success'
    },
    'additionalEventData': {
      'MobileVersion': 'Yes',
      'LoginTo': 'https://console.aws.amazon.com/sns',
      'MFAUsed': 'Yes'
    },
    'eventID': '5d2c2f55-3d1e-4336-b940-dbf8e66f588c',
    'eventType': 'AwsConsoleSignIn'
  }
};
