var message = require('../lib/message');
var utils = require('../lib/utils');

module.exports.config = {
  name: 'whitelistedIAMActions',
  parameters: {
    'whitelistedActions': {
      'Type': 'String',
      'Description': 'Comma separated list of whitelisted actions',
    }
  }
};

module.exports.fn = function(event, callback) {

  var whitelisted = utils.splitOnComma(process.env.whitelistedActions);
  var document = JSON.parse(event.detail.requestParameters.policyDocument);
  var userName = event.detail.userIdentity.userName;
  var blacklistedServices = utils.splitOnComma(process.env.blacklistedServices);

  // build list of actions used.
  var actions = [];
  document.Statement.forEach(function(policy) {
    if (!Array.isArray(policy.Action))
      actions.push(policy.Action);
    else
      actions = actions.concat(policy.Action);
  });

  var violations = [];
  actions.forEach(function(pair) {
    var parts = pair.split(':');
    var service = parts[0];
    var action = parts[1];
    // Disallow * no matter what
    if (action === '*')
      violations.push(pair);
    // Check if a blacklisted service, and not on the whitelist
    else if (blacklistedServices.indexOf(service) > -1 && whitelisted.indexOf(pair) < 0) {
      violations.push(pair);
    }
  });

  if (violations.length > 0) {
    var notif = {
      subject: 'Blacklisted actions ' + violations.join(' ') + ' used in policy',
      body: JSON.stringify(event)
    };
    message(notif, function(err, result) {
      callback(err, result);
    });
  } else {
    callback(null, 'Blacklisted action was not used in policy');
  }

};