var message = require('lambda-cfn').message;
var splitOnComma = require('lambda-cfn').splitOnComma;

module.exports.config = {
  name: 'bannedPorts',
  parameters: {
    'allowedPorts': {
      'Type': 'String',
      'Description': 'Comma separated list of allowed open ports',
    }
  },
  statements: [
    {
      "Effect": "Allow",
      "Action": [
        "ec2:DescribeRegions",
        "ec2:DescribeSecurityGroups"
      ],
      "Resource": "*"
    }
  ],
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

  var allowedPorts = splitOnComma(process.env.allowedPorts);

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
              var bannedPorts = getBannedPorts(allowedPorts, sg.IpPermissions);
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

module.exports.getBannedPorts = getBannedPorts;
function getBannedPorts(allowedPorts, rules) {
  var bannedPorts = [];
  rules.forEach(function(rule) {
    // ec2 API and cloudtrail events use different structures
    // cloudtrail uses `items` property in front of arrays
    var ranges = rule.ipRanges ? rule.ipRanges.items : rule.IpRanges;
    var groups = rule.UserIdGroupPairs || rule.userIdGroupPairs;
    ranges.forEach(function(range) {
      var cidrip = range.CidrIp || range.cidrIp;
      // Open to world and not using security groups
      if (cidrip === '0.0.0.0/0' || groups.length) {
        var openPorts = [];
        var i = rule.FromPort || rule.fromPort;
        var j = rule.ToPort || rule.toPort;
        while (j >= i) {
          openPorts.push(j);
          j--;
        }
        allowedPorts.forEach(function(allowed) {
          var index = openPorts.indexOf(parseInt(allowed, 10));
          if (index > -1)
            openPorts.splice(openPorts.indexOf(parseInt(allowed, 10)), 1);
        });
        bannedPorts = bannedPorts.concat(openPorts);
      }
    });
  });
  return bannedPorts.sort();
}
