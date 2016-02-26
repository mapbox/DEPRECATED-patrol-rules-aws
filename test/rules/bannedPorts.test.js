var test = require('tape');

var rule = require('../../rules/bannedPorts');
var fn = rule.fn;
var name = rule.config.name;

test('getBannedPorts unit tests', function(t) {
  var getBannedPorts = rule.getBannedPorts;

  var rules = [
    {
      "ipProtocol": "tcp",
      "fromPort": 10001,
      "toPort": 10004,
      "groups": {},
      "ipRanges": {
        "items": [
          {
            "cidrIp": "0.0.0.0/0"
          }
        ]
      },
      "prefixListIds": {}
    }
  ];

  var allowed = ['30000'];
  var banned = getBannedPorts(allowed, rules);
  t.deepEqual(banned, [10001,10002,10003,10004],
    'Range of ports correctly banned with one allowed port out of range');

  var allowed = ['10001'];
  var banned = getBannedPorts(allowed, rules);
  t.deepEqual(banned, [10002,10003,10004],
    'Range of ports correctly banned with one allowed port in range');

  var allowed = [];
  var banned = getBannedPorts(allowed, rules);
  t.deepEqual(banned, [10001,10002,10003,10004],
    'Range of ports correctly banned with no allowed ports');

  var allowed = ['10001','10002'];
  var banned = getBannedPorts(allowed, rules);
  t.deepEqual(banned, [10003,10004],
    'Range of ports correctly banned with multiple allowed ports in range');

  var allowed = ['30000','30001'];
  var banned = getBannedPorts(allowed, rules);
  t.deepEqual(banned, [10001,10002,10003,10004],
    'Range of ports correctly banned with multiple allowed ports out of range');

  var rules = [
    {
      "ipProtocol": "tcp",
      "fromPort": 10001,
      "toPort": 10004,
      "groups": {},
      "ipRanges": {
        "items": [
          {
            "cidrIp": "0.0.0.0/0"
          }
        ]
      },
      "prefixListIds": {}
    },
    {
      "ipProtocol": "tcp",
      "fromPort": 22,
      "toPort": 22,
      "groups": {},
      "ipRanges": {
        "items": [
          {
            "cidrIp": "0.0.0.0/0"
          }
        ]
      },
      "prefixListIds": {}
    }
  ];

  var allowed = ['30000'];
  var banned = getBannedPorts(allowed, rules);
  t.deepEqual(banned, [10001,10002,10003,10004,22],
    'Range of ports correctly banned with multiple rules one allowed port out of range');

  var allowed = ['10001'];
  var banned = getBannedPorts(allowed, rules);
  t.deepEqual(banned, [10002,10003,10004,22],
    'Range of ports correctly banned with multiple rules and one allowed port in range');

  var allowed = [];
  var banned = getBannedPorts(allowed, rules);
  t.deepEqual(banned, [10001,10002,10003,10004,22],
    'Range of ports correctly banned with multiple rules and no allowed ports');

  var allowed = ['10001','10002'];
  var banned = getBannedPorts(allowed, rules);
  t.deepEqual(banned, [10003,10004,22],
    'Range of ports correctly banned with multiple rules and multiple allowed ports in range');

  var allowed = ['30000','30001'];
  var banned = getBannedPorts(allowed, rules);
  t.deepEqual(banned, [10001,10002,10003,10004,22],
    'Range of ports correctly banned with multiple rules and multiple allowed ports out of range');

  var rules = [
    {
      "ipProtocol": "tcp",
      "fromPort": 10001,
      "toPort": 10001,
      "groups": {},
      "ipRanges": {
        "items": [
          {
            "cidrIp": "0.0.0.0/0"
          }
        ]
      },
      "prefixListIds": {}
    }
  ];

  var allowed = ['30000'];
  var banned = getBannedPorts(allowed, rules);
  t.deepEqual(banned, [10001],
    'Port correctly banned with one rule and one allowed port');

  var allowed = ['10001'];
  var banned = getBannedPorts(allowed, rules);
  t.deepEqual(banned, [],
    'Port correctly banned with one rule and one allowed port');

  var allowed = [];
  var banned = getBannedPorts(allowed, rules);
  t.deepEqual(banned, [10001],
    'Port correctly banned with one rule and no allowed ports');

  var allowed = ['10001','10002'];
  var banned = getBannedPorts(allowed, rules);
  t.deepEqual(banned, [],
    'Port correctly banned with one rule and multiple allowed ports');

  var allowed = ['30000','30001'];
  var banned = getBannedPorts(allowed, rules);
  t.deepEqual(banned, [10001],
    'Port correctly banned with one rule and multiple allowed ports');


  t.end();

});

test('bannedPorts rule', function(t) {

  var event = {
    "detail": {
      "requestParameters": {
        "ipPermissions": {
          "items": [
            {
              "ipProtocol": "tcp",
              "fromPort": 30001,
              "toPort": 30001,
              "groups": {},
              "ipRanges": {
                "items": [
                  {
                    "cidrIp": "0.0.0.0/0"
                  }
                ]
              },
              "prefixListIds": {}
            }
          ]
        },
        "groupName": "mySecurityGroupName"
      }
    }
  };

  process.env.allowedPorts = '30001';

  fn(event, function(err, message) {
    t.error(err, 'No error when calling ' + name);
  });

  var event = {
    "detail": {
      "requestParameters": {
        "ipPermissions": {
          "items": [
            {
              "ipProtocol": "tcp",
              "fromPort": 10001,
              "toPort": 10001,
              "groups": {},
              "ipRanges": {
                "items": [
                  {
                    "cidrIp": "0.0.0.0/0"
                  }
                ]
              },
              "prefixListIds": {}
            }
          ]
        },
        "groupName": "mySecurityGroupName"
      }
    }
  };

  process.env.allowedPorts = '30001';

  fn(event, function(err, message) {
    console.log(message);
    t.error(err, 'No error when calling ' + name);
  });
  t.end();

});
