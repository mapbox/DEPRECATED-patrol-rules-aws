const lambdaCfn = require('@mapbox/lambda-cfn');

module.exports.fn = function(event, context, callback) {
  if (event.detail.errorCode) return callback(null, event.detail.errorMessage);

  if (event.detail.eventName === 'PutBucketAcl') {
    let permissions = publicPermissions(event);
    if (permissions.length) {
      return notify(event, permissions, callback);
    }
  }

  callback(null, 'Bucket Public Access ACL was not changed.');
};

function publicPermissions(event) {
  let permissions = [];
  let grants = event.detail.requestParameters.AccessControlPolicy.AccessControlList.Grant;
  if (typeof grants === 'undefined') { // Catches edge case in which a bucket is created that nobody has permissions to
    return permissions;
  }

  for (let i = 0; i < grants.length; i++) {
    if (grants[i].Grantee.URI === 'http://acs.amazonaws.com/groups/global/AllUsers') {
      permissions.push(grants[i].Permission);
    }
  }

  return permissions;
}

function notify(event, permissions, callback) {
  let bucketName = event.detail.requestParameters.bucketName;
  let permissionsList = permissions.join(', ');
  let message = {
    subject: 'Bucket Public Access ACL was changed.',
    summary: 'Patrol detected that ' + bucketName + ' Public Access ACL has changed (' + permissionsList + ').',
    event: event
  };

  lambdaCfn.message(message, (err, result) => {
    callback(err, result);
  });
}

