const test = require('tape');
const rule = require('../removeS3AccessLogging/function');
const fn = rule.fn;

test('Detects if access logging is disabled on bucket', (t) => {
  const event = {
    'detail': {
      'eventSource': 's3.amazonaws.com',
      'eventName': 'PutBucketLogging',
      'requestParameters': {
        'BucketLoggingStatus': {
          'xmlns': 'http://doc.s3.amazonaws.com/2006-03-01/'
        },
        'bucketName': 'lolrus',
        'logging': [
          ''
        ]
      }
    }
  };

  fn(event, {}, (err, message) => {
    t.error(err, 'does not error');
    t.equal(message.subject, 'S3 server access logging removed from lolrus', 'Should detect that access logging removed');
    t.end();
  });
});

test('Do not trigger notification when access logging is enabled', (t) => {
  const event = {
    'detail': {
      'eventSource': 's3.amazonaws.com',
      'eventName': 'PutBucketLogging',
      'requestParameters': {
        'BucketLoggingStatus': {
          'xmlns': 'http://doc.s3.amazonaws.com/2006-03-01/',
          'LoggingEnabled': {
            'TargetPrefix': 'lolrus/',
            'TargetBucket': 'access-logging-bucket'
          }
        },
        'bucketName': 'lolrus',
        'logging': [
          ''
        ]
      }
    }
  };

  fn(event, {}, (err, message) => {
    t.error(err, 'Does not error');
    t.equal(message, 'S3 server access logging not disabled', 'It should not send a notification');
    t.end();
  });
});

test('Do not trigger notification for bucket listed in bucketFilter', (t) => {
  process.env.bucketFilter = 'unlogged';
  const event = {
    'detail': {
      'eventSource': 's3.amazonaws.com',
      'eventName': 'PutBucketLogging',
      'requestParameters': {
        'BucketLoggingStatus': {
          'xmlns': 'http://doc.s3.amazonaws.com/2006-03-01/'
        },
        'bucketName': 'unlogged-bucket',
        'logging': [
          ''
        ]
      }
    }
  };

  fn(event, {}, (err, message) => {
    t.error(err, 'does not error');
    t.equal(message, 'S3 bucket unlogged-bucket filtered, access logging change ignored', 'Should report that bucket was in filter');
    t.end();
  });
});