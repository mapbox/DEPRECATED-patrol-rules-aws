var message = require('../lib/message');

module.exports.config = {
  name: 'cloudfrontModifyDelete',
  parameters: {
    'protectedEvents': {
      'Type': 'String',
      'Description': 'Comma separated list of protected CloudFront event names',
    },
    'protectedDistributions': {
      'Type': 'String',
      'Description': 'Comma separated list of protected CloudFront distributions'
    }
  }
};

module.exports.fn = function(event, callback) {

  var protectedEvents = module.exports.splitOnComma(process.env.protectedEvents);
  var protectedDistributions = module.exports.splitOnComma(process.env.protectedDistributions);
  var eventDistribution = event.detail.requestParameters.id;
  var eventName = event.detail.eventName; 

  // Check for fuzzy match for protected CloudFront distributions
  var distributionMatch = protectedDistributions.filter(function(distribution) {
    return eventDistribution.indexOf(distribution) > -1;
  });

  if (distributionMatch.length > 0) {

    // Check for fuzzy match for protected CloudFront event names
    var eventsMatch = protectedEvents.filter(function(event) {
      return eventName.indexOf(event) > -1;
    })

    if(eventsMatch.length > 0) {
      var notif = {
        subject: eventName + ' called on protected CloudFront distribution ' + eventDistribution,
        body: eventName + ' called on protected CloudFront distribution ' + eventDistribution
      };
      message(notif, function(err, result) {
        callback(err, result);
      });
    } else {
      callback(null, 'Protected CloudFront event was not called')
    }

  } else {
    callback(null, 'Protected CloudFront distribution was not updated');
  }
};

module.exports.splitOnComma = function(str) {
  return str.split(/\s*,\s*/);
};