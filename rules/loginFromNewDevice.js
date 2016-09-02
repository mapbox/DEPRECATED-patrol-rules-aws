var AWS = require('aws-sdk');
var getEnv = require('lambda-cfn').getEnv;
var message = require('lambda-cfn').message;
var SHA = require('jssha');

module.exports.config = {
  name: 'loginFromNewDevice',
  sourcePath: 'rules/loginFromNewDevice.js',
  parameters: {
    Bucket: {
      Type: 'String',
      Description: 'S3 bucket for storing a list of known devices'
    },
    BucketPrefix: {
      Type: 'String',
      Description: 'S3 bucket prefix where the list of known devices is stored'
    }
  },
  statements: [
    {
      Effect: 'Allow',
      Action: [
        's3:GetObject',
        's3:ListBucket',
        's3:PutObject'
      ],
      Resource: {
        'Fn::Join': [
          '',
          [
            'arn:aws:s3:::',
            { Ref: 'patrolrulesawsloginFromNewDeviceBucket' },
            '/',
            { Ref: 'patrolrulesawsloginFromNewDeviceBucketPrefix' },
            '/',
            '*'
          ]
        ]
      }
    }
  ],
  eventRule: {
    eventPattern: {
      'detail-type': [
        'AWS API Call via CloudTrail'
      ],
      detail: {
        eventSource: [
          'signin.amazonaws.com'
        ],
        eventName: [
          'ConsoleLogin'
        ]
      }
    }
  }
};

module.exports.fn = function(evt, cb) {
  var hash = generateDeviceIdentity(evt);
  var note = generateNotification(evt);

  var s3params = {
    Bucket: getEnv('Bucket'),
    Prefix: getEnv('BucketPrefix')
  };
  var s3bucket = evt.s3bucket || new AWS.S3(s3params);

  isNewDevice(s3bucket, hash, function(err, isNew) {
    if (isNew) {
      // Add new hash to s3 bucket + prefix
      var iden = evt.userIdentity.principalId;
      var agen = evt.userAgent;
      var params = {
        Key: s3params.Prefix + '/' + hash,
        Body: iden + ' signed in from ' + agen + ' on ' + Date.now()
      };
      s3bucket.putObject(params, function(err, _) {
        if (err) console.log(err);

        message(note, cb);
      });
    } else {
      cb(null, 'Device is known');
    }
  });
};

/**
 * Generate a hash to identify a user's device
 * TODO: implement the real hashing thing
 * @param {object} evt is a CloudTrail event
 * @return {string} hash the identifies a user's device
 */
function generateDeviceIdentity(evt) {
  var shaObj = new SHA('SHA-256', 'TEXT');
  shaObj.update(evt.userIdentity.arn + evt.userAgent);
  return shaObj.getHash('HEX');
};

/**
 * Generate a notification object to be sent to patrol
 * @param {object} evt is a CloudTrail event
 * @return {object} following the patrol spec
 */
function generateNotification(evt) {
  var u = evt.userIdentity.principalId;
  var d = evt.userAgent;
  return {
    subject: 'Login from a new device',
    summary: 'First time ' + u + ' logins from ' + d,
    event: evt
  }
};

/**
 * Match a user's device hash against a list of known devices
 * @param {object} s3bucket is an instance of AWS.S3 initialized on a bucket
 * @param {string} iden is a hash that identifies a user's device
 * @param {function} done callback to return (err, isNew) to the caller
 *
 */
function isNewDevice(s3bucket, iden, done) {
  s3bucket.listObjects({}, function(err, list) {
    if (err) return done(err);

    // Skip the s3 key and grab the hash (the last element in the path)
    var knownHashes = list.Contents
      .map(function(d) {
        return d.Key.split('/').slice(-1)[0];
      });

    done(null, knownHashes.indexOf(iden) < 0);
  });
};

module.exports.generateDeviceIdentity = generateDeviceIdentity;
module.exports.generateNotification = generateNotification;
module.exports.isNewDevice = isNewDevice;
