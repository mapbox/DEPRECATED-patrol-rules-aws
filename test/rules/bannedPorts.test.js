var test = require('tape');

var rule = require('../../rules/bannedPorts');
var fn = rule.fn;
var name = rule.config.name;

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

  t.end();

});
