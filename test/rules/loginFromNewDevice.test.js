var AWS = require('aws-sdk');
var AWSMock = require('aws-sdk-mock');
var sinon = require('sinon');
var test = require('tape');

var rule = require('../../rules/loginFromNewDevice');
var fn = rule.fn;
var name = rule.config.name;

var evt = {
  "eventVersion": "1.02",
  "userIdentity": {
    "type": "AssumedRole",
    "principalId": "ABCDEFGHIJKL:lolcat",
    "arn": "arn:aws:sts::13371337:assumed-role/evilcorp-iam-groups-roles-production-HackerRole-1LEFOO1001/lolcat",
    "accountId": "13371337",
    "sessionContext": {
      "attributes": {
        "mfaAuthenticated": "true",
        "creationDate": "2016-06-08T00:28:05Z"
      },
      "sessionIssuer": {
        "type": "Role",
        "principalId": "ABCDEFGHIJKL",
        "arn": "arn:aws:iam::13371337:role/evilcorp-iam-groups-roles-production-HackerRole-1LEFOO1001",
        "accountId": "13371337",
        "userName": "evilcorp-iam-groups-roles-production-HackerRole-1LEFOO1001"
      }
    }
  },
  "eventTime": "2016-06-08T00:28:07Z",
  "eventSource": "signin.amazonaws.com",
  "eventName": "ConsoleLogin",
  "awsRegion": "us-east-1",
  "sourceIPAddress": "50.1.124.10",
  "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/51.0.2704.63 Safari/537.36",
  "requestParameters": null,
  "responseElements": {
    "ConsoleLogin": "Success"
  },
  "additionalEventData": {
    "MobileVersion": "No",
    "MFAUsed": "No"
  },
  "eventID": "foobar-15f5-417e-1010-0c63b33f44e6",
  "eventType": "AwsConsoleSignIn",
  "recipientAccountId": "13371337"
};

var s3mock = {
  Contents: [
    {
      Key: "playground/rodowi/known-devices/0x00b33f",
      LastModified: "2016-06-15T01:47:16.000Z",
      ETag: "d41d8cd98f00b204e9800998ecf8427e"
    },
    {
      Key: "playground/rodowi/known-devices/0xf00000",
      LastModified: "2016-06-15T01:46:22.000Z",
      ETag: "d41d8cd98f00b204e9800998ecf8427e"
    }
  ]
};

var s3bucket = null;

test('setup', function (t) {
  AWSMock.mock('S3', 'listObjects', function (params, cb) {
    cb(null, s3mock);
  });

  s3bucket = new AWS.S3({
    params: {
      Bucket: 'evilcorp',
      Prefix: 'rodowi/known-devices'
    }
  });
  t.end();
});

test('loginFromNewDevice.generateDeviceIdentity', function (t) {
  var found = rule.generateDeviceIdentity(evt);
  var wants = found.match(/[0-9a-f]{64}/);
  t.equal(found, wants[0], 'generates a identify hash');
  t.end();
});

test('loginFromNewDevice.isNewDevice', function (t) {
  t.plan(2);

  var stub = sinon.stub(s3bucket, 'listObjects', function (ops, cb) {
    cb(null, s3mock);
  });

  rule.isNewDevice(s3bucket, 'Random Mozilla', function (err, isNew) {
    t.true(isNew, 'Random Mozilla is a new device');
  });

  rule.isNewDevice(s3bucket, 'b33f', function (err, isNew) {
    t.false(isNew, 'b33f is a known device');
    s3bucket.listObjects.restore();
  });
});

test('loginFromNewDevice.listDevices', function (t) {
  t.plan(2);

  var stub = sinon.stub(s3bucket, 'listObjects', function (ops, cb) {
    cb(null, s3mock);
  });

  rule.listDevices(s3bucket, function (err, list) {
    t.equal(list.length, 2, 'finds 2 known devices');
    t.true(list[0].Key.match(/b33f/), 'finds a b33f device');
    s3bucket.listObjects.restore();
  });
});

test('Login from known device', function (t) {
  t.plan(2);

  fn(evt, function (err, message) {
    t.error(err, 'No error when calling ' + name);
    t.equal(message, 'Device is known');
  });
});

test('Login from new device', function (t) {
  t.plan(3);

  evt.userAgent = 'Internet Explorer 5.0';
  var summary = 'First time ABCDEFGHIJKL:lolcat logins from ' + evt.userAgent;

  fn(evt, function (err, message) {
    t.error(err, 'No error when calling ' + name);
    t.equal(message.subject, 'Login from a new device');
    t.equal(message.summary, summary);
  });
});
