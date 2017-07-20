var test = require('tape');
var rule = require('../../rules/bucketACL');
var fn = rule.fn;

test('Detects bucket ACL changed correctly', function(t) {
  rule.fn(bucketAclEvent, {}, function(err, message) {
    t.equal(message.subject, 'Bucket ACL was changed.', 'Detect bucket ACL was changed');
    t.end();
  });
});

var bucketAclEvent = {
  "detail": {
    "eventSource": "s3.amazonaws.com",
    "eventName": "PutBucketAcl",
    "requestParameters": {
      "bucketName": "mapbox"
    }
  }
}
