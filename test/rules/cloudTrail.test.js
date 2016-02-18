var test = require('tape');
var utils = require('../../lib/utils');

var rule = require('../../rules/cloudTrail');
var fn = rule.fn;
var name = rule.config.name;

test('cloudTrail rule', function(t) {

  process.env.blacklistedEvents = "CreateTrail, DeleteTrail, StartLogging, StopLogging, UpdateTrail";
  var blacklisted = utils.splitOnComma(process.env.blacklistedEvents);

  // Event for unexpected change to API, especially a new or renamed CloudTrail event
  var newTrailEvent = {
    "detail": {
      "eventSource": "cloudtrail.amazonaws.com",
      "eventName": "UndocumentedEvent"
    },
    "requestParameters": {
      "name": 'arn:aws:cloudtrail:us-east-1:12345678901:trail:bob-cloudtrail'
    }
  };

  fn(newTrailEvent, function(err, message) {
    t.error(err, 'No error when calling ' + name);
    t.equal(message, 'Blacklisted CloudTrail event was not called',
      'Blacklisted CloudTrail event was not called');
  });

  blacklisted.filter(function(event) {

    createTest(event, t);

  });

  t.end();

});

function createTest(eventName, t) {

  var event = {
    "detail": {
      "eventSource": "cloudtrail.amazonaws.com",
      "eventName": eventName
    },
    "requestParameters": {
      "name": 'arn:aws:cloudtrail:us-east-1:12345678901:trail:bob-cloudtrail'
    }
  };

  fn(event, function(err, message) {
    t.deepEqual(message, {
      body: eventName + ' called on arn:aws:cloudtrail:us-east-1:12345678901:trail:bob-cloudtrail',
      subject: eventName + ' called on arn:aws:cloudtrail:us-east-1:12345678901:trail:bob-cloudtrail'
    }, 'Matches ' + eventName + ' CloudTrail event');
  });

}