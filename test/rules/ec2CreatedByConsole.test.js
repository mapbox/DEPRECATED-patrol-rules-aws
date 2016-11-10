var test = require('tape');
var rule = require('../../rules/ec2CreatedByConsole.js');

test('Detects instance EC2 created by console', function(t) {
  rule.fn(eventCreatedByConsole, function(err, message) {
    t.equal(message.subject, 'User created instance EC2 by console.', 'ALARM!! Detect user created EC2 by console');
    t.end();
  });
});

test('Detects instance EC2 created by cloudformation', function(t) {
  rule.fn(eventCreatedByCloudformation, function(err, message) {
    t.equal(message, 'Not problem', 'Not problem!! Detect user created EC2 by cloudformation');
    t.end();
  });
});

test('Detects instance EC2 created by autoscaling', function(t) {
  rule.fn(eventCreatedByAutoscaling, function(err, message) {
    t.equal(message, 'Not problem', 'Not problem!! Detect user created EC2 by autoscaling');
    t.end();
  });
});

var eventCreatedByConsole = {
  "eventVersion": "1.04",
  "userIdentity": {
    "type": "IAMUser",
    "principalId": "AAAAAAAAAAAAAAAAAA",
    "arn": "arn:aws:iam::123456789012:user/iward",
    "accountId": "123456789012",
    "accessKeyId": "AAAAAAAAAAAAAAAAAA",
    "userName": "iward",
    "sessionContext": {
      "attributes": {
        "mfaAuthenticated": "true",
        "creationDate": "2016-08-24T16:33:52Z"
      }
    },
    "invokedBy": "signin.amazonaws.com"
  },
  "eventTime": "2016-08-24T20:46:15Z",
  "eventSource": "ec2.amazonaws.com",
  "eventName": "RunInstances",
  "awsRegion": "us-east-1",
  "sourceIPAddress": "101.39.154.200",
  "userAgent": "signin.amazonaws.com",
  "requestParameters": {
    "instancesSet": {
      "items": [{
        "imageId": "ami-aaaaaaaa",
        "minCount": 1,
        "maxCount": 1,
        "keyName": "iward"
      }]
    },
    "groupSet": {
      "items": [{
        "groupId": "sg-aaaaaaaa"
      }]
    },
    "instanceType": "m3.large",
    "blockDeviceMapping": {
      "items": [{
        "deviceName": "/dev/sda1",
        "ebs": {
          "volumeSize": 8,
          "deleteOnTermination": true,
          "volumeType": "gp2"
        }
      }, {
        "deviceName": "/dev/sdb",
        "virtualName": "ephemeral0"
      }, {
        "deviceName": "/dev/sdc",
        "noDevice": {}
      }]
    },
    "monitoring": {
      "enabled": false
    },
    "disableApiTermination": false,
    "clientToken": "BBBBBBBBBBBBBBBB",
    "ebsOptimized": false
  },
  "responseElements": {
    "reservationId": "r-aaaaaaaa",
    "ownerId": "123456789012",
    "groupSet": {},
    "instancesSet": {
      "items": [{
        "instanceId": "i-aaaaaaaa",
        "imageId": "ami-aaaaaaaa",
        "instanceState": {
          "code": 0,
          "name": "pending"
        },
        "privateDnsName": "ip-172-31-29-116.ec2.internal",
        "keyName": "iward",
        "amiLaunchIndex": 0,
        "productCodes": {},
        "instanceType": "m3.large",
        "launchTime": 1472071575000,
        "placement": {
          "availabilityZone": "us-east-1d",
          "tenancy": "default"
        },
        "monitoring": {
          "state": "disabled"
        },
        "subnetId": "subnet-bbbbbbbb",
        "vpcId": "vpc-cccccccc",
        "privateIpAddress": "172.31.29.116",
        "stateReason": {
          "code": "pending",
          "message": "pending"
        },
        "architecture": "x86_64",
        "rootDeviceType": "ebs",
        "rootDeviceName": "/dev/sda1",
        "blockDeviceMapping": {},
        "virtualizationType": "hvm",
        "hypervisor": "xen",
        "clientToken": "DtFWV1472071575026",
        "interfaceId": "interface-bea280a4",
        "groupSet": {
          "items": [{
            "groupId": "sg-cccccccc",
            "groupName": "launch-wizard-7"
          }]
        },
        "sourceDestCheck": true,
        "networkInterfaceSet": {
          "items": [{
            "networkInterfaceId": "eni-aaaaaaaa",
            "internalInterfaceId": "interface-aaaaaaaa",
            "subnetId": "subnet-aaaaaaaa",
            "vpcId": "vpc-aaaaaaaa",
            "availabilityZone": "us-east-1d",
            "ownerId": "123456789012",
            "requesterManaged": false,
            "status": "in-use",
            "macAddress": "0e:7f:b4:4a:c4:dd",
            "privateIpAddress": "172.31.29.116",
            "privateDnsName": "ip-172-31-29-116.ec2.internal",
            "sourceDestCheck": true,
            "groupSet": {
              "items": [{
                "groupId": "sg-aaaaaaaa",
                "groupName": "launch-wizard-7"
              }]
            },
            "attachment": {
              "attachmentId": "eni-attach-aaaaaaaa",
              "instanceId": "i-aaaaaaaa",
              "instanceOwnerId": "123456789012",
              "deviceIndex": 0,
              "status": "attaching",
              "attachTime": 1472071575000,
              "deleteOnTermination": true
            },
            "attachableToInstanceBySet": {},
            "associableWithElasticIpBySet": {},
            "privateIpAddressesSet": {
              "item": [{
                "privateIpAddress": "172.31.29.116",
                "privateDnsName": "ip-172-31-29-116.ec2.internal",
                "primary": true
              }]
            },
            "tagSet": {}
          }]
        },
        "ebsOptimized": false
      }]
    }
  },
  "requestID": "10a9998d-0d7d-4cc4-b9c9-b2bad3ac416a",
  "eventID": "3a10e115-d6ce-46fa-ba2a-c9dab4c08217",
  "eventType": "AwsApiCall",
  "recipientAccountId": "123456789012"
};

var eventCreatedByCloudformation = {
  "eventVersion": "1.04",
  "userIdentity": {
    "type": "IAMUser",
    "principalId": "AAAAAAAAAAAAAAAAAA",
    "arn": "arn:aws:iam::123456789012:user/iward",
    "accountId": "123456789012",
    "accessKeyId": "AAAAAAAAAAAAAAAAAA",
    "userName": "iward",
    "sessionContext": {
      "attributes": {
        "mfaAuthenticated": "true",
        "creationDate": "2016-08-24T16:33:52Z"
      }
    },
    "invokedBy": "signin.amazonaws.com"
  },
  "eventTime": "2016-08-24T20:46:15Z",
  "eventSource": "ec2.amazonaws.com",
  "eventName": "RunInstances",
  "awsRegion": "us-east-1",
  "sourceIPAddress": "cloudformation.amazonaws.com",
  "userAgent": "cloudformation.amazonaws.com",
  "requestParameters": {
    "instancesSet": {
      "items": [{
        "imageId": "ami-aaaaaaaa",
        "minCount": 1,
        "maxCount": 1,
        "keyName": "iward"
      }]
    },
    "groupSet": {
      "items": [{
        "groupId": "sg-aaaaaaaa"
      }]
    },
    "instanceType": "m3.large",
    "blockDeviceMapping": {
      "items": [{
        "deviceName": "/dev/sda1",
        "ebs": {
          "volumeSize": 8,
          "deleteOnTermination": true,
          "volumeType": "gp2"
        }
      }, {
        "deviceName": "/dev/sdb",
        "virtualName": "ephemeral0"
      }, {
        "deviceName": "/dev/sdc",
        "noDevice": {}
      }]
    },
    "monitoring": {
      "enabled": false
    },
    "disableApiTermination": false,
    "clientToken": "BBBBBBBBBBBBBBBB",
    "ebsOptimized": false
  },
  "responseElements": {
    "reservationId": "r-aaaaaaaa",
    "ownerId": "123456789012",
    "groupSet": {},
    "instancesSet": {
      "items": [{
        "instanceId": "i-aaaaaaaa",
        "imageId": "ami-aaaaaaaa",
        "instanceState": {
          "code": 0,
          "name": "pending"
        },
        "privateDnsName": "ip-172-31-29-116.ec2.internal",
        "keyName": "iward",
        "amiLaunchIndex": 0,
        "productCodes": {},
        "instanceType": "m3.large",
        "launchTime": 1472071575000,
        "placement": {
          "availabilityZone": "us-east-1d",
          "tenancy": "default"
        },
        "monitoring": {
          "state": "disabled"
        },
        "subnetId": "subnet-bbbbbbbb",
        "vpcId": "vpc-cccccccc",
        "privateIpAddress": "172.31.29.116",
        "stateReason": {
          "code": "pending",
          "message": "pending"
        },
        "architecture": "x86_64",
        "rootDeviceType": "ebs",
        "rootDeviceName": "/dev/sda1",
        "blockDeviceMapping": {},
        "virtualizationType": "hvm",
        "hypervisor": "xen",
        "clientToken": "DtFWV1472071575026",
        "interfaceId": "interface-bea280a4",
        "groupSet": {
          "items": [{
            "groupId": "sg-cccccccc",
            "groupName": "launch-wizard-7"
          }]
        },
        "sourceDestCheck": true,
        "networkInterfaceSet": {
          "items": [{
            "networkInterfaceId": "eni-aaaaaaaa",
            "internalInterfaceId": "interface-aaaaaaaa",
            "subnetId": "subnet-aaaaaaaa",
            "vpcId": "vpc-aaaaaaaa",
            "availabilityZone": "us-east-1d",
            "ownerId": "123456789012",
            "requesterManaged": false,
            "status": "in-use",
            "macAddress": "0e:7f:b4:4a:c4:dd",
            "privateIpAddress": "172.31.29.116",
            "privateDnsName": "ip-172-31-29-116.ec2.internal",
            "sourceDestCheck": true,
            "groupSet": {
              "items": [{
                "groupId": "sg-aaaaaaaa",
                "groupName": "launch-wizard-7"
              }]
            },
            "attachment": {
              "attachmentId": "eni-attach-aaaaaaaa",
              "instanceId": "i-aaaaaaaa",
              "instanceOwnerId": "123456789012",
              "deviceIndex": 0,
              "status": "attaching",
              "attachTime": 1472071575000,
              "deleteOnTermination": true
            },
            "attachableToInstanceBySet": {},
            "associableWithElasticIpBySet": {},
            "privateIpAddressesSet": {
              "item": [{
                "privateIpAddress": "172.31.29.116",
                "privateDnsName": "ip-172-31-29-116.ec2.internal",
                "primary": true
              }]
            },
            "tagSet": {}
          }]
        },
        "ebsOptimized": false
      }]
    }
  },
  "requestID": "10a9998d-0d7d-4cc4-b9c9-b2bad3ac416a",
  "eventID": "3a10e115-d6ce-46fa-ba2a-c9dab4c08217",
  "eventType": "AwsApiCall",
  "recipientAccountId": "123456789012"
};

var eventCreatedByAutoscaling = {
  "eventVersion": "1.04",
  "userIdentity": {
    "type": "IAMUser",
    "principalId": "AAAAAAAAAAAAAAAAAA",
    "arn": "arn:aws:iam::123456789012:user/iward",
    "accountId": "123456789012",
    "accessKeyId": "AAAAAAAAAAAAAAAAAA",
    "userName": "iward",
    "sessionContext": {
      "attributes": {
        "mfaAuthenticated": "true",
        "creationDate": "2016-08-24T16:33:52Z"
      }
    },
    "invokedBy": "signin.amazonaws.com"
  },
  "eventTime": "2016-08-24T20:46:15Z",
  "eventSource": "ec2.amazonaws.com",
  "eventName": "RunInstances",
  "awsRegion": "us-east-1",
  "sourceIPAddress": "autoscaling.amazonaws.com",
  "userAgent": "autoscaling.amazonaws.com",
  "requestParameters": {
    "instancesSet": {
      "items": [{
        "imageId": "ami-aaaaaaaa",
        "minCount": 1,
        "maxCount": 1,
        "keyName": "iward"
      }]
    },
    "groupSet": {
      "items": [{
        "groupId": "sg-aaaaaaaa"
      }]
    },
    "instanceType": "m3.large",
    "blockDeviceMapping": {
      "items": [{
        "deviceName": "/dev/sda1",
        "ebs": {
          "volumeSize": 8,
          "deleteOnTermination": true,
          "volumeType": "gp2"
        }
      }, {
        "deviceName": "/dev/sdb",
        "virtualName": "ephemeral0"
      }, {
        "deviceName": "/dev/sdc",
        "noDevice": {}
      }]
    },
    "monitoring": {
      "enabled": false
    },
    "disableApiTermination": false,
    "clientToken": "BBBBBBBBBBBBBBBB",
    "ebsOptimized": false
  },
  "responseElements": {
    "reservationId": "r-aaaaaaaa",
    "ownerId": "123456789012",
    "groupSet": {},
    "instancesSet": {
      "items": [{
        "instanceId": "i-aaaaaaaa",
        "imageId": "ami-aaaaaaaa",
        "instanceState": {
          "code": 0,
          "name": "pending"
        },
        "privateDnsName": "ip-172-31-29-116.ec2.internal",
        "keyName": "iward",
        "amiLaunchIndex": 0,
        "productCodes": {},
        "instanceType": "m3.large",
        "launchTime": 1472071575000,
        "placement": {
          "availabilityZone": "us-east-1d",
          "tenancy": "default"
        },
        "monitoring": {
          "state": "disabled"
        },
        "subnetId": "subnet-bbbbbbbb",
        "vpcId": "vpc-cccccccc",
        "privateIpAddress": "172.31.29.116",
        "stateReason": {
          "code": "pending",
          "message": "pending"
        },
        "architecture": "x86_64",
        "rootDeviceType": "ebs",
        "rootDeviceName": "/dev/sda1",
        "blockDeviceMapping": {},
        "virtualizationType": "hvm",
        "hypervisor": "xen",
        "clientToken": "DtFWV1472071575026",
        "interfaceId": "interface-bea280a4",
        "groupSet": {
          "items": [{
            "groupId": "sg-cccccccc",
            "groupName": "launch-wizard-7"
          }]
        },
        "sourceDestCheck": true,
        "networkInterfaceSet": {
          "items": [{
            "networkInterfaceId": "eni-aaaaaaaa",
            "internalInterfaceId": "interface-aaaaaaaa",
            "subnetId": "subnet-aaaaaaaa",
            "vpcId": "vpc-aaaaaaaa",
            "availabilityZone": "us-east-1d",
            "ownerId": "123456789012",
            "requesterManaged": false,
            "status": "in-use",
            "macAddress": "0e:7f:b4:4a:c4:dd",
            "privateIpAddress": "172.31.29.116",
            "privateDnsName": "ip-172-31-29-116.ec2.internal",
            "sourceDestCheck": true,
            "groupSet": {
              "items": [{
                "groupId": "sg-aaaaaaaa",
                "groupName": "launch-wizard-7"
              }]
            },
            "attachment": {
              "attachmentId": "eni-attach-aaaaaaaa",
              "instanceId": "i-aaaaaaaa",
              "instanceOwnerId": "123456789012",
              "deviceIndex": 0,
              "status": "attaching",
              "attachTime": 1472071575000,
              "deleteOnTermination": true
            },
            "attachableToInstanceBySet": {},
            "associableWithElasticIpBySet": {},
            "privateIpAddressesSet": {
              "item": [{
                "privateIpAddress": "172.31.29.116",
                "privateDnsName": "ip-172-31-29-116.ec2.internal",
                "primary": true
              }]
            },
            "tagSet": {}
          }]
        },
        "ebsOptimized": false
      }]
    }
  },
  "requestID": "10a9998d-0d7d-4cc4-b9c9-b2bad3ac416a",
  "eventID": "3a10e115-d6ce-46fa-ba2a-c9dab4c08217",
  "eventType": "AwsApiCall",
  "recipientAccountId": "123456789012"
};
