const message = require('@mapbox/lambda-cfn').message;
const splitOnComma = require('@mapbox/lambda-cfn').splitOnComma;

module.exports.fn = function(event, context, callback) {
  if (event.detail.errorCode) return callback(null, event.detail.errorMessage);
  let disallowed = splitOnComma(process.env.disallowedRoles);
  let assumedRoleArn = event.detail.requestParameters.roleArn;
  let userName = event.detail.userIdentity.userName;

  // Check for fuzzy match
  let match = disallowed.filter((role) => {
    return assumedRoleArn.indexOf(role) > -1;
  });

  if (match.length > 0) {
    let notif = {
      subject: 'Disallowed role ' + match[0] + ' assumed',
      summary: 'Disallowed role ' + match[0] + ' assumed by ' + userName,
      event: event
    };
    message(notif, function(err, result) {
      callback(err, result);
    });
  } else {
    callback(null, 'Disallowed role was not assumed');
  }
};
