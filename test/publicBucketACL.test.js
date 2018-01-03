var test = require('tape');

var rule = require('../publicBucketACL/function');
var fn = rule.fn;

test('Detects if bucket was make public', function(t) {
    var event = {
        'detail': {
            'eventSource': 's3.amazonaws.com',
            'eventName': 'PutBucketAcl',
            "requestParameters": {
                "bucketName": "mapbox",
                "AccessControlPolicy": {
                    "AccessControlList": {
                        "Grant": [
                            {
                                "Grantee": {
                                    "xsi:type": "Group",
                                    "xmlns:xsi": "http://www.w3.org/2001/XMLSchema-instance",
                                    "URI": "http://acs.amazonaws.com/groups/global/AllUsers"
                                },
                                "Permission": "READ_ACP"
                            }
                        ]
                    }
                }
            }
        }
    };

    fn(event, {}, function(err, message) {
        t.equal(message.subject, 'Bucket ACL was changed.', 'Should detect that Public ACL changes');
        t.ok(message.summary.includes('READ_ACP'), 'The summary should contain the permissions.');
        t.end();
    });
});

test('Do not trigger notification there is nothing public.', function(t) {
    var event = {
        'detail': {
            'eventSource': 's3.amazonaws.com',
            'eventName': 'PutBucketAcl',
            "requestParameters": {
                "bucketName": "mapbox",
                "AccessControlPolicy": {
                    "AccessControlList": {
                        "Grant": [
                            {
                                "Grantee": {
                                    "xsi:type": "CanonicalUser",
                                },
                            }
                        ]
                    }
                }
            }
        }
    };

    fn(event, {}, function(err, message) {
        t.equal(message, 'Bucket ACL was not changed.', 'It should not send any message');
        t.end();
    });
});

test('Trigger notification on multiple public access permissions.', function(t) {
    var event = {
        'detail': {
            'eventSource': 's3.amazonaws.com',
            'eventName': 'PutBucketAcl',
            "requestParameters": {
                "bucketName": "mapbox",
                "AccessControlPolicy": {
                    "AccessControlList": {
                        "Grant": [
                            {
                                "Grantee": {
                                    "xsi:type": "Group",
                                    "xmlns:xsi": "http://www.w3.org/2001/XMLSchema-instance",
                                    "URI": "http://acs.amazonaws.com/groups/global/AllUsers"
                                },
                                "Permission": "READ"
                            },
                            {
                                "Grantee": {
                                    "xsi:type": "Group",
                                    "xmlns:xsi": "http://www.w3.org/2001/XMLSchema-instance",
                                    "URI": "http://acs.amazonaws.com/groups/global/AllUsers"
                                },
                                "Permission": "WRITE_ACP"
                            },
                            {
                                "Grantee": {
                                    "xsi:type": "Group",
                                    "xmlns:xsi": "http://www.w3.org/2001/XMLSchema-instance",
                                    "URI": "http://acs.amazonaws.com/groups/global/AllUsers"
                                },
                                "Permission": "READ_ACP"
                            }
                        ]
                    }
                }
            }
        }
    };

    fn(event, {}, function(err, message) {
        t.equal(message.subject, 'Bucket ACL was changed.', 'Should The bucket ACL change');
        t.end();
    });
});
