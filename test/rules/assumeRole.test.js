var test = require('tape');

var rule = require('../../rules/assumeRole');
var fn = rule.fn;
var name = rule.config.name;

test('assumeRole rule', function(t) {

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

  process.env.disallowedRoles = 'Administrator, DBMaintenance';

  fn(event, function(err, message) {
    t.error(err, 'No error when calling ' + name);

    if (JSON.stringify(message.summary).match(/Disallowed role Administrator assumed by bob/)) {
      t.pass('Matches disallowed Administrator role');
    } else {
      t.fail('Does not match disallowed Administrator role');
    }

  });

  var event = {
    "detail": {
      "userIdentity": {
        "userName": "bob",
      },
      "requestParameters": {
        "roleArn": "arn:aws:iam::12345678901:role/basic-123456",
        "roleSessionName": "bob"
      }
    }
  };

  process.env.disallowedRoles = 'Administrator, DBMaintenance';

  fn(event, function(err, message) {
    t.error(err, 'No error when calling ' + name);
    t.equal(message, 'Disallowed role was not assumed',
      'Does not match non disallowed role');
  });

  var event = {
    "detail": {
      errorCode: "AccessDenied",
      errorMessage: "This is the error message"
    }
  };

  process.env.disallowedRoles = 'Administrator, DBMaintenance';

  fn(event, function(err, message) {
    t.error(err, 'No error when calling ' + name);
    t.equal(message, 'This is the error message',
      'errorMessage is returned in callback');
  });

  t.end();

});
