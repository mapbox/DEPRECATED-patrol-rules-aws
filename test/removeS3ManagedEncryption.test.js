const test = require('tape');

const rule = require('../removeS3ManagedEncryption/function.js');
const fn = rule.fn;

test('Alerts if S3 managed encryption removed from bucket', (t) => {

  let event = {
    'detail': {
      'eventSource': 's3.amazonaws.com',
      'eventName': 'DeleteBucketEncryption',
      'requestParameters': {
        'encryption': [ '' ],
        'bucketName': 'i-has-a-bucket'
      }
    }
  };

  fn(event, {}, (err, message) => {
    t.error(err, 'does not error');
    t.equal(message.subject, 'Bucket encryption removed from i-has-a-bucket', 'Should alarm when encryption removed');
    t.end();
  });

});