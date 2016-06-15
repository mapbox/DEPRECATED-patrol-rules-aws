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

test('loginFromNewDevice.generateDeviceIdentity', function (t) {
	var found = rule.generateDeviceIdentity(evt);
	var wants = found.match(/[0-9a-f]{64}/);
	t.equal(found, wants[0], 'generates a identify hash');
	t.end();
});

test('Login from known device', function (t) {
  t.plan(2);

  fn(evt, function (err, message) {
    t.error(err, 'No error when calling ' + name);
    t.equal(message, 'Device is known');
  });
});

test('Login from new device', function (t) {
  t.plan(2);

	evt.userAgent = 'Internet Explorer 5.0';

  fn(evt, function (err, message) {
    t.error(err, 'No error when calling ' + name);
    t.equal(message, 'User login from a new device');
  });
});
