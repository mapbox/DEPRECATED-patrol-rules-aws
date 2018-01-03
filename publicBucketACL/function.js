var lambdaCfn = require('@mapbox/lambda-cfn');

module.exports.fn = function(event, context, callback) {
    if (event.detail.errorCode) return callback(null, event.detail.errorMessage);

    var permissions = publicPermissions(event);

    if (event.detail.eventName === 'PutBucketAcl' && permissions.length) {
        return notify(event, permissions, callback);
    }

    callback(null, 'Bucket ACL was not changed.');
};

function publicPermissions(event) {
    var permissions = [];
    var grants = event.detail.requestParameters.AccessControlPolicy.AccessControlList.Grant;

    for (var i = 0; i < grants.length; i++) {
        if (grants[i].Grantee.URI === 'http://acs.amazonaws.com/groups/global/AllUsers') {
            permissions.push(grants[i].Permission);
        }
    }

    return permissions;
}

function notify(event, permissions, callback) {
    var bucketName = event.detail.requestParameters.bucketName;
    var permissions = permissions.join(' ,');
    var message = {
        subject: 'Bucket ACL was changed.',
        summary: 'Patrol detected that ' + bucketName + ' ACL has changed (' + permissions + ').',
        event: event
    };

    console.log(message);

    lambdaCfn.message(message, function(err, result) {
        callback(err, result);
    });
}
