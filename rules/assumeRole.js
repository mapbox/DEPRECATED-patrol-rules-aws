module.exports.config = {
  name: 'assumeRole',
  parameters: {
    'blacklistedRoles': {
      'Type': 'String',
      'Description': 'Comma separated list of blacklisted roles',
    }
  }
};

module.exports.fn = function(event, callback) {

  var blacklisted = process.env.blacklistedRoles.split(/\s*,\s*/);
  var assumedRoleArn = event.detail.requestParameters.roleArn;
  var userName = event.detail.userIdentity.userName;
  // Check for fuzzy match
  blacklisted.forEach(function(role) {
    if (assumedRoleArn.indexOf(role) > -1) {
      return callback(null, 'Blacklisted role ' + role + ' assumed by ' + userName);
    }
  });
  callback(null, 'Blacklisted role was not assumed');
};
