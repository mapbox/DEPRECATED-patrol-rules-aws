const message = require('@mapbox/lambda-cfn').message;
const splitOnComma = require('@mapbox/lambda-cfn').splitOnComma;

module.exports.fn = (event, context, callback) => {
  if (event.detail.errorCode) return callback(null, event.detail.errorMessage);

  let protectedActions = splitOnComma(process.env.protectedActions);
  let protectedDistributions = splitOnComma(process.env.protectedDistributions);
  let eventDistribution = event.detail.requestParameters.id;
  let eventName = event.detail.eventName;

  // Check for fuzzy match for protected CloudFront distributions
  let distributionMatch = protectedDistributions.filter((distribution) => {
    return eventDistribution.indexOf(distribution) > -1;
  });

  if (distributionMatch.length > 0) {

    // Check for fuzzy match for protected CloudFront event names
    let eventsMatch = protectedActions.filter(function(event) {
      return eventName.indexOf(event) > -1;
    });

    if (eventsMatch.length > 0) {
      let notif = eventMessage(eventName, eventDistribution, event);
      message(notif, (err, result) => {
        callback(err, result);
      });
    } else {
      callback(null, 'Protected CloudFront event was not called');
    }
  } else {
    callback(null, 'Protected CloudFront distribution was not updated');
  }
};

function eventMessage(eventName, eventDistribution, event) {
  if (event.detail.userIdentity.arn) {

  }
  let principal = event.detail.userIdentity.arn ? event.detail.userIdentity.arn.split('/').slice(-1)[0] : event.detail.userIdentity.sessionContext.sessionIssuer.arn;
  if (process.env.DispatchSnsArn) {
    return {
      type: 'broadcast',
      retrigger: 'false',
      users: [
        {
          slackId: '' //default to dispatches fallback channel
        }
      ],
      body: {
        github: {
          title: `${eventName} called on protected CloudFront distribution ${eventDistribution} by ${principal}`,
          body: `${eventName} called on protected CloudFront distribution ${eventDistribution} by ${principal} \n\n\n ${JSON.stringify(event)}`
        },
        slack: {
          message: `${eventName} called on protected CloudFront distribution ${eventDistribution} by ${principal}`
        }
      }
    };
  } else {
    return {
      subject: eventName + ' called on protected CloudFront distribution ' + eventDistribution,
      summary: eventName + ' called on protected CloudFront distribution ' + eventDistribution,
      event: event
    };
  }
};
