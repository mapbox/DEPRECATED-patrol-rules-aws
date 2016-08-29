var tape = require('tape');
var nock = require('nock');
var rule = require('../../rules/browserLogin.js');

var browserLoginEvent = {
	"eventVersion": "1.04",
	"eventTime": "2016-08-24T16:21:20Z",
	"eventSource": "signin.amazonaws.com",
	"eventName": "ConsoleLogin",
	"awsRegion": "us-east-1",
	"sourceIPAddress": "11.11.12.112",
	"userAgent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/49.0.2623.87 Safari/537.36",
	"requestParameters": null
};

tape('Up-to-date browser login', function(t) {
	rule.fn(browserLoginEvent, function(err, message) {
		t.equal(message.subject, 'Login from up to date browser');
		t.end();
	});
});

tape('Out-of-date browser login', function(t) {
	rule.fn(browserLoginEvent, function(err, message) {
		t.equal(message.subject, 'Login from out of date browser');
		t.end();
	});
});
