var test = require('tape');

var rule = require('../publicBucketACL/function');
var fn = rule.fn;

test('Detects if bucket was make public', (t) => {
  var event = {
    'detail': {
      'eventSource': 's3.amazonaws.com',
      'eventName': 'PutBucketAcl',
      'requestParameters': {
        'bucketName': 'mapbox',
        'AccessControlPolicy': {
          'AccessControlList': {
            'Grant': [
              {
                'Grantee': {
                  'xsi:type': 'Group',
                  'xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
                  'URI': 'http://acs.amazonaws.com/groups/global/AllUsers'
                },
                'Permission': 'READ_ACP'
              }
            ]
          }
        }
      }
    }
  };

  fn(event, {}, (err, message) => {
    t.error(err, 'does not error');
    t.equal(message.subject, 'Bucket Public Access ACL was changed.', 'Should detect that Public ACL changes');
    t.ok(message.summary.includes('READ_ACP'), 'The summary should contain the permissions.');
    t.end();
  });
});

test('Do not trigger notification there is nothing public.', (t) => {
  var event = {
    'detail': {
      'eventSource': 's3.amazonaws.com',
      'eventName': 'PutBucketAcl',
      'requestParameters': {
        'bucketName': 'mapbox',
        'AccessControlPolicy': {
          'AccessControlList': {
            'Grant': [
              {
                'Grantee': {
                  'xsi:type': 'CanonicalUser',
                },
              }
            ]
          }
        }
      }
    }
  };

  fn(event, {}, (err, message) => {
    t.error(err, 'does not error');
    t.equal(message, 'Bucket Public Access ACL was not changed.', 'It should not send any message');
    t.end();
  });
});

test('Trigger notification on multiple public access permissions.', (t) => {
  var event = {
    'detail': {
      'eventSource': 's3.amazonaws.com',
      'eventName': 'PutBucketAcl',
      'requestParameters': {
        'bucketName': 'mapbox',
        'AccessControlPolicy': {
          'AccessControlList': {
            'Grant': [
              {
                'Grantee': {
                  'xsi:type': 'Group',
                  'xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
                  'URI': 'http://acs.amazonaws.com/groups/global/AllUsers'
                },
                'Permission': 'READ'
              },
              {
                'Grantee': {
                  'xsi:type': 'Group',
                  'xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
                  'URI': 'http://acs.amazonaws.com/groups/global/AllUsers'
                },
                'Permission': 'WRITE_ACP'
              },
              {
                'Grantee': {
                  'xsi:type': 'Group',
                  'xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
                  'URI': 'http://acs.amazonaws.com/groups/global/AllUsers'
                },
                'Permission': 'READ_ACP'
              }
            ]
          }
        }
      }
    }
  };

  fn(event, {}, (err, message) => {
    t.error(err, 'does not error');
    t.equal(message.subject, 'Bucket Public Access ACL was changed.', 'Should The bucket ACL change');
    t.end();
  });
});

test('Doesn\'t error if Grant field doesn\'t exist.', (t) => {
  var event = {
    'detail': {
      'eventSource': 's3.amazonaws.com',
      'eventName': 'PutBucketAcl',
      'requestParameters': {
        'bucketName': 'mapbox',
        'AccessControlPolicy': {
          'AccessControlList': {
          }
        }
      }
    }
  };

  fn(event, {}, (err, message) => {
    t.error(err, 'does not error');
    t.equal(message, 'Bucket Public Access ACL was not changed.', 'It should not send any message');
    t.end();
  });
});
