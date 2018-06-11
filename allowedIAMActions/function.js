const lambdaCfn = require('@mapbox/lambda-cfn');

module.exports.fn = (event, context, callback) => {
  if (event.detail.errorCode) return callback(null, event.detail.errorMessage);

  const allowedActions = lambdaCfn.splitOnComma(process.env.allowedActions);
  const document = JSON.parse(event.detail.requestParameters.policyDocument);
  const restrictedServices = lambdaCfn.splitOnComma(process.env.restrictedServices);
  const ignoredRolePolicy = lambdaCfn.splitOnComma(process.env.ignoredRolePolicy);

  const role = event.detail.userIdentity.sessionContext.sessionIssuer.userName ? event.detail.userIdentity.sessionContext.sessionIssuer.userName : 'unknown';
  const policyArn = event.detail.requestParameters.policyArn ? event.detail.requestParameters.policyArn : 'unknown';

  if (ignoredRolePolicy.length > 0) {
    let skipMsg;
    let matched;
    ignoredRolePolicy.forEach((pair) => {
      const ignoredRole = new RegExp(pair.split(':')[0], 'i');
      const ignoredPolicy = new RegExp(pair.split(':')[1], 'i');

      if (ignoredRole.test(role) && ignoredPolicy.test(policyArn)) {
        skipMsg = `Matched role '${role}' and policyArn '${policyArn}' to ignoredRolePolicy value '${pair}', skipping`;
        console.log(skipMsg);
        matched = true;
      }
    });
    if (matched) return callback(null, skipMsg);
  };

  // build list of actions used.
  let actions = [];
  if (Array.isArray(document.Statement)) {
    document.Statement.forEach((policy) => {
      policyProcessor(policy);
    });
  } else {
    policyProcessor(document.Statement);
  }

  function policyProcessor(policy) {
    if (!Array.isArray(policy.Action)) {
      actions.push(policy.Action);
    } else {
      actions = actions.concat(policy.Action);
    }
  }

  let violations = [];
  actions.forEach((pair) => {
    let parts = pair.split(':');
    let service = parts[0];

    // Check if a restricted service, and not on the allowed list.
    if (restrictedServices.indexOf(service) > -1 && allowedActions.indexOf(pair) < 0) {
      violations.push(pair);
    }
  });

  if (violations.length > 0) {
    let notif = {
      subject: 'Disallowed actions used in policy',
      summary: 'Disallowed actions ' + violations.join(' ') + ' used in policy',
      event: event
    };
    lambdaCfn.message(notif, (err, result) => {
      callback(err, result);
    });
  } else {
    callback(null, 'Disallowed action was not used in policy');
  }
};
