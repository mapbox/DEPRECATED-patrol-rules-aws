var lambdaCfn = require('@mapbox/lambda-cfn');

module.exports.fn = function(event, context, callback) {
  if (event.detail.errorCode)
    return callback(null, event.detail.errorMessage);

  var allowedActions = lambdaCfn.splitOnComma(process.env.allowedActions);
  var document = JSON.parse(event.detail.requestParameters.policyDocument);
  var restrictedServices = lambdaCfn.splitOnComma(process.env.restrictedServices);

  // build list of actions used.
  var actions = [];
  if (Array.isArray(document.Statement)) {
    document.Statement.forEach(function(policy) {
      policyProcessor(policy);
    });
  } else {
    policyProcessor(document.Statement);
  }

  function policyProcessor(policy) {
    if (!Array.isArray(policy.Action))
      actions.push(policy.Action);
    else
      actions = actions.concat(policy.Action);
  }

  var violations = [];
  actions.forEach(function(pair) {
    var parts = pair.split(':');
    var service = parts[0];

    // Check if a restricted service, and not on the allowed list.
    if (restrictedServices.indexOf(service) > -1 && allowedActions.indexOf(pair) < 0) {
      violations.push(pair);
    }
  });

  if (violations.length > 0) {
    var notif = {
      subject: 'Disallowed actions used in policy',
      summary: 'Disallowed actions ' + violations.join(' ') + ' used in policy',
      event: event
    };
    lambdaCfn.message(notif, function(err, result) {
      callback(err, result);
    });
  } else {
    callback(null, 'Disallowed action was not used in policy');
  }
};
