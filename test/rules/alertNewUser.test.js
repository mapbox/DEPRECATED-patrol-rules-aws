var test = require('tape');
var rule = require('../../rules/alertNewUser.js');

test('Se genero un usuario nuevo', function(t) {
	rule.fn(newUserEvent, function(err, message) {
		t.equal(message.subject, 'New user was created', ' it is ok');
		t.end();
	});
});

var newUserEvent = {
	"eventVersion": "1.02",
	"userIdentity": {
		"type": "AssumedRole",
		"principalId": "AAAAAAAAAAAAAAAAAAA:bob",
		"arn": "arn:aws:sts::123456789012:assumed-role/foo/bob",
		"accountId": "123456789012",
		"accessKeyId": "AAAAAAAAAAAAAAAAAAA",
		"sessionContext": {
			"attributes": {
				"mfaAuthenticated": "true",
				"creationDate": "2016-08-22T19:18:12Z"
			},
			"sessionIssuer": {
				"type": "Role",
				"principalId": "AAAAAAAAAAAAAAAAAAA",
				"arn": "arn:aws:iam::123456789012:role/foo",
				"accountId": "123456789012",
				"userName": "foo"
			}
		}
	},
	"eventTime": "2016-08-22T19:22:40Z",
	"eventSource": "iam.amazonaws.com",
	"eventName": "CreateUser",
	"awsRegion": "us-east-1",
	"sourceIPAddress": "101.40.109.70",
	"userAgent": "aws-sdk-nodejs/2.2.33 linux/v4.4.2",
	"requestParameters": {
		"userName": "jane"
	},
	"responseElements": {
		"user": {
			"path": "/",
			"arn": "arn:aws:iam::123456789012:user/jane",
			"userId": "AAAAAAAAAAAAAAAAAAA",
			"createDate": "Aug 22, 2016 7:22:40 PM",
			"userName": "jane"
		}
	},
	"requestID": "aaaaaaa-689d-11e6-b602-5d608f0abf3f",
	"eventID": "bbbbbbbb-1a4a-4d51-bae9-7c03c153a86d",
	"eventType": "AwsApiCall",
	"recipientAccountId": "123456789012"
};