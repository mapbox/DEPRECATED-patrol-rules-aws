var message = require('lambda-cfn').message;

module.exports.config = {
  name: 'bucketACL',
  runtime: 'nodejs4.3',
  sourcePath: 'rules/bucketACL.js',
  eventRule: {
    eventPattern: {
      'detail-type': [
        'AWS S3 bucket ACL change'
      ],
      detail: {
        eventSource: [
          's3.amazonaws.com'
        ],
        eventName: [
          'PutBucketAcl'
        ]
      }
    }
  }
};

module.exports.fn = function(event, context, callback) {
  if (event.detail.errorCode)
    return callback(null, event.detail.errorMessage);
  var bucketName = event.detail.requestParameters.bucketName;

  if (event.detail.eventName === 'PutBucketAcl') {
    var notif = {
      subject: 'Bucket ACL was changed.',
      summary: 'Patrol detected that ' + bucketName + ' ACL has changed.',
      event: event
    };
    console.log(notif);
    message(notif, function(err, result) {
      callback(err, result);
    });
  } else {
    callback(null, 'Bucket ACL was not changed.')
  }
};
