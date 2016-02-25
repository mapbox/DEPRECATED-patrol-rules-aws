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

function createTest(eventName, t) {

  var event = {
    "detail": {
      "eventSource": "cloudtrail.amazonaws.com",
      "eventName": eventName
    }
  };

  fn(event, function(err, message) {
    t.deepEqual(message, {
      subject: 'Blacklisted CloudTrail event ' + eventName + ' called',
      summary: 'Blacklisted CloudTrail event ' + eventName + ' called',
      event: {
        "detail": {
          "eventSource": "cloudtrail.amazonaws.com",
          "eventName": eventName
        }
      }
    }, 'Matches ' + eventName + ' CloudTrail event');
  });

}
