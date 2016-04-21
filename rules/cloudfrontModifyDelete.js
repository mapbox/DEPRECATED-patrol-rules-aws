var message = require('lambda-cfn').message;
var splitOnComma = require('lambda-cfn').splitOnComma;
var getEnv = require('lambda-cfn').getEnv;

module.exports.config = {
  name: 'cloudfrontModifyDelete',
  sourcePath: 'rules/cloudfrontModifyDelete.js',
  parameters: {
    protectedActions: {
      Type: 'String',
      Description: 'Comma separated list of protected CloudFront API actions'
    },
    protectedDistributions: {
      Type: 'String',
      Description: 'Comma separated list of protected CloudFront distributions'
    }
  },
  eventRule: {
    eventPattern:{
      'detail-type': [
        'AWS API Call via CloudTrail'
      ],
      detail: {
        eventSource: [
          'cloudfront.amazonaws.com'
        ],
        eventName: [
          'UpdateDistribution',
          'DeleteDistribution',
          'UpdateDistribution2016_01_28',
          'DeleteDistribution2016_01_28'
        ]
      }
    }
  }
};

module.exports.fn = function(event, callback) {
  if (event.detail.errorCode)
    return callback(null, event.detail.errorMessage);

  var protectedActions = splitOnComma(getEnv('protectedActions'));
  var protectedDistributions = splitOnComma(getEnv('protectedDistributions'));
  var eventDistribution = event.detail.requestParameters.id;
  var eventName = event.detail.eventName;

  // Check for fuzzy match for protected CloudFront distributions
  var distributionMatch = protectedDistributions.filter(function(distribution) {
    return eventDistribution.indexOf(distribution) > -1;
  });

  if (distributionMatch.length > 0) {

    // Check for fuzzy match for protected CloudFront event names
    var eventsMatch = protectedActions.filter(function(event) {
      return eventName.indexOf(event) > -1;
    });

    if (eventsMatch.length > 0) {
      var notif = {
        subject: eventName + ' called on protected CloudFront distribution ' + eventDistribution,
        summary: eventName + ' called on protected CloudFront distribution ' + eventDistribution,
        event: event
      };
      message(notif, function(err, result) {
        callback(err, result);
      });
    } else {
      callback(null, 'Protected CloudFront event was not called');
    }

  } else {
    callback(null, 'Protected CloudFront distribution was not updated');
  }
};
