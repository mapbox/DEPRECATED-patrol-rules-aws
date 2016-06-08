var message = require('lambda-cfn').message;

module.exports.config = {
  name: 'loginFromNewDevice',
  sourcePath: 'rules/loginFromNewDevice.js',
  parameters: {
    deviceHistory: {
      Type: 'String',
      Description: 'ARN of S3 bucket for storing a list of known devices'
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
      Resource: { Ref: 'deviceHistory' }
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

  if (isNewDevice(hash)) {
    message(note, function(err, res) {
      cb(err, res)
    });
  } else {
    cb(null, ':ok_hand:');
  }
};

/**
 * Generate a hash to identify a user's device
 * TODO: implement the real hashing thing
 * @param {object} evt is a CloudTrail event
 * @return {string} hash the identifies a user's device
 */
function generateDeviceIdentity(evt) {
  return evt.userIdentity.arn + evt.userAgent;
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
 * TODO: use an external storage, e.g. S3
 * @param {string} dhash is a hash that identifies a user's device
 * @return {boolean} to determine if a user's device is new
 */
function isNewDevice(dhash) {
  return dhash.match(/Safari/);
};

module.exports.generateDeviceIdentity = generateDeviceIdentity;
module.exports.generateNotification = generateNotification;
module.exports.isNewDevice = isNewDevice;
