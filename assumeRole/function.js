var message = require('@mapbox/lambda-cfn').message;
var splitOnComma = require('@mapbox/lambda-cfn').splitOnComma;

module.exports.fn = function(event, context, callback) {
  if (event.detail.errorCode)
    return callback(null, event.detail.errorMessage);
  var disallowed = splitOnComma(process.env.disallowedRoles);
  var assumedRoleArn = event.detail.requestParameters.roleArn;
  var userName = event.detail.userIdentity.userName;

  // Check for fuzzy match
  var match = disallowed.filter(function(role) {
    return assumedRoleArn.indexOf(role) > -1;
  });

  if (match.length > 0) {
    var notif = {
      subject: 'Disallowed role ' + match[0]  + ' assumed',
      summary: 'Disallowed role ' + match[0]  + ' assumed by ' + userName,
      event: event
    };
    message(notif, function(err, result) {
      callback(err, result);
    });
  } else {
    callback(null, 'Disallowed role was not assumed');
  }
};
