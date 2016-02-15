var test = require('tape');

var rule = require('../../rules/assumeRole');
var fn = rule.fn;
var name = rule.config.name;
var splitOnComma = rule.splitOnComma;

test('splitOnComma unit tests', function(t) {

  t.deepEqual(
    splitOnComma('foo, bar'),
    ['foo', 'bar'],
    'split string with comma'
  );

  t.deepEqual(
    splitOnComma('foo'),
    ['foo'],
    'split string with no comma'
  );

  t.deepEqual(
    splitOnComma('foo,bar'),
    ['foo', 'bar'],
    'split string with comma and no space'
  );

  t.end();
});

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

  process.env.blacklistedRoles = 'Administrator, DBMaintenance';

  fn(event, function(err, message) {
    t.error(err, 'No error when calling ' + name);
    t.deepEqual(message, {
      body: 'Blacklisted role Administrator assumed by bob',
      subject: 'Blacklisted role Administrator assumed'
    }, 'Matches blacklisted Administrator role');
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

  process.env.blacklistedRoles = 'Administrator, DBMaintenance';

  fn(event, function(err, message) {
    t.error(err, 'No error when calling ' + name);
    t.equal(message, 'Blacklisted role was not assumed',
      'Does not match non blacklisted role');
  });

  t.end();

});
