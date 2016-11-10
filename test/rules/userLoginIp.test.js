var tape = require('tape');
var rule = require('../../rules/userLoginIp.js');

process.env.allowedCountries = 'US,PE,IN';

tape('Detects user from ip login from allowed country', function(t) {
	rule.fn(ipAllowedCountry, function(err, message) {
		t.equal(message, 'nothing happen', 'allowed contry');
		t.end();
	});
});

tape('Detects user from ip login from not allowed country', function(t) {
	rule.fn(ipnotAllowedCountry, function(err, message) {
		t.equal(message.subject, 'sign in from unknown country.', 'Detected user login from unknown country');
		t.end();
	});
});

var ipAllowedCountry = {
	"eventVersion": "1.04",
	"userIdentity": {
		"type": "AssumedRole",
		"principalId": "AAAAAAAAAAAAAAAA",
		"arn": "arn:aws:sts::12345678912",
		"accountId": "12345678912",
		"sessionContext": {
			"attributes": {
				"mfaAuthenticated": "true",
				"creationDate": "2016-08-24T16:21:19Z"
			},
			"sessionIssuer": {
				"type": "Role",
				"principalId": "AAAAAAAAAAAAAAAAA",
				"arn": "arn:aws:iam::12345678912",
				"accountId": "12345678912",
				"userName": "foo"
			}
		}
	},
	"eventTime": "2016-08-24T16:21:20Z",
	"eventSource": "signin.amazonaws.com",
	"eventName": "ConsoleLogin",
	"awsRegion": "us-east-1",
	"sourceIPAddress": "190.237.209.17",
	"userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/52.0.2743.116 Safari/537.36",
	"requestParameters": null,
	"responseElements": {
		"ConsoleLogin": "Success"
	},
	"additionalEventData": {
		"MobileVersion": "No",
		"MFAUsed": "No"
	},
	"eventID": "1234567890",
	"eventType": "AwsConsoleSignIn",
	"recipientAccountId": "12345678912"
};

var ipnotAllowedCountry = {
	"eventVersion": "1.04",
	"userIdentity": {
		"type": "AssumedRole",
		"principalId": "AAAAAAAAAAAAAAAA",
		"arn": "arn:aws:sts::12345678912",
		"accountId": "12345678912",
		"sessionContext": {
			"attributes": {
				"mfaAuthenticated": "true",
				"creationDate": "2016-08-24T16:21:19Z"
			},
			"sessionIssuer": {
				"type": "Role",
				"principalId": "AAAAAAAAAAAAAAAAA",
				"arn": "arn:aws:iam::12345678912",
				"accountId": "12345678912",
				"userName": "foo"
			}
		}
	},
	"eventTime": "2016-08-24T16:21:20Z",
	"eventSource": "signin.amazonaws.com",
	"eventName": "ConsoleLogin",
	"awsRegion": "us-east-1",
	"sourceIPAddress": "2.24.0.0",
	"userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/52.0.2743.116 Safari/537.36",
	"requestParameters": null,
	"responseElements": {
		"ConsoleLogin": "Success"
	},
	"additionalEventData": {
		"MobileVersion": "No",
		"MFAUsed": "No"
	},
	"eventID": "1234567890",
	"eventType": "AwsConsoleSignIn",
	"recipientAccountId": "12345678912"
};