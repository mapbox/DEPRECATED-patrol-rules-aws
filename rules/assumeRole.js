var message = require('../lib/message');

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

  var blacklisted = module.exports.splitOnComma(process.env.blacklistedRoles);
  var assumedRoleArn = event.detail.requestParameters.roleArn;
  var userName = event.detail.userIdentity.userName;

  // Check for fuzzy match
  var match = blacklisted.filter(function(role) {
    return assumedRoleArn.indexOf(role) > -1;
  });

  if (match.length > 0)
    message('Blacklisted role ' + match[0] + ' assumed by ' + userName, function(err, result) {
      callback(err, result);
    });
  else
    callback(null, 'Blacklisted role was not assumed');
};

module.exports.splitOnComma = function(str) {
  return str.split(/\s*,\s*/);
};
