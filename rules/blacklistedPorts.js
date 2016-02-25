var message = require('../lib/message');
var utils = require('../lib/utils');

module.exports.config = {
  name: 'blacklistedPorts',
  parameters: {
    'allowedPorts': {
      'Type': 'String',
      'Description': 'Comma separated list of allowed open ports',
    }
  },
  eventRule: {
    eventPattern: {
      "detail-type": [
        "AWS API Call via CloudTrail"
      ],
      "detail": {
        "eventSource": [
          "ec2.amazonaws.com"
        ],
        "eventName": [
          "AuthorizeSecurityGroupIngress"
        ]
      }
    }
  }
};

module.exports.fn = function(event, callback) {
  if (event.detail.errorCode)
    return callback(null, event.detail.errorMessage);

  var allowedPorts = process.env.allowedPorts;

  // Scheduled based event
  if (event['detail-type'] == 'Scheduled Event') {
    // XXX run in each region. right now just runs in us-east-1
    var AWS = require('aws-sdk');
    var ec2 = new AWS.EC2({region: 'us-east-1'});

    ec2.describeSecurityGroups(function(err, data) {
      if (err) throw err;
      data.SecurityGroups.forEach(function(sg) {
        // IpPermissions are inbound rules
        var rules = sg.IpPermissions;
        if (rules.length) {
          rules.forEach(function(rule) {
            rule.IpRanges.forEach(function(range) {
              if (range.CidrIp === '0.0.0.0/0') {
                var blacklistedPorts = getBlacklistedPorts(allowedPorts, rule);
                if (blacklistedPorts.length)
                  console.log(sg);
                // XXX do something
              }
            });
          });
        }
      });
    });
  } else {
    // Trigger based event
    
  }

};

module.exports.getBlacklistedPorts = function(allowedPorts, rule) {
  var openPorts = [];
  var i = rule.FromPort;
  var j = rule.ToPort;
  while (j >= i) {
    openPorts.push(j);
    j--;
  }
  allowedPorts.forEach(function(allowed) {
    openPorts.splice(openPorts.indexOf(allowed), 1);
  });
  return openPorts;
};
