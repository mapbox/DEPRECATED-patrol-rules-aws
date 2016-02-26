var message = require('../lib/message');
var utils = require('../lib/utils');

module.exports.config = {
  name: 'bannedPorts',
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

  // Scheduled based trigger
  if (event['detail-type'] == 'Scheduled Event') {
    var AWS = require('aws-sdk');
    var ec2 = new AWS.EC2({region: 'us-east-1'});

    ec2.describeRegions(function(err, data) {
      if (err) return callback(err);
      data.Regions.forEach(function(regionDetail) {
        var ec2 = new AWS.EC2({region: regionDetail.RegionName});
        ec2.describeSecurityGroups(function(err, data) {
          if (err) return callback(err);
          data.SecurityGroups.forEach(function(sg) {
            // IpPermissions are inbound rules
            if (sg.IpPermissions.length) {
              var bannedPorts = getBannedPorts(allowedPorts, rules);
              if (bannedPorts.length) {
                var notif = {
                  subject: 'Banned ports used in security group',
                  summary: 'Banned ports used in security group: ' + bannedPorts.join(', '),
                  event: event
                };
                message(notif, function(err, result) {
                  callback(err, result);
                });
              } else {
                callback(null, 'Banned ports were not used in security group');
              }
            }
          });
        });
      });
    });
  } else {
    // Event-based trigger
    var rules = event.detail.requestParameters.ipPermissions.items;
    var bannedPorts = getBannedPorts(allowedPorts, rules);
    if (bannedPorts.length) {
      var notif = {
        subject: 'Banned ports used in security group',
        summary: 'Banned ports used in security group: ' + bannedPorts.join(', '),
        event: event
      };
      message(notif, function(err, result) {
        callback(err, result);
      });
    } else {
      callback(null, 'Banned ports were not used in security group');
    }
  }
};

module.exports.getBannedPorts = function(allowedPorts, rules) {
  var bannedPorts = [];
  rules.forEach(function(rule) {
    var ranges = rule.IpRanges.items ? rule.IpRanges.items : rule.IpRanges;
    ranges.forEach(function(range) {
      if (range.CidrIp === '0.0.0.0/0') {
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
        bannedPorts = bannedPorts.concat(openPorts);
      }
    });
  });
  return bannedPorts;
};
