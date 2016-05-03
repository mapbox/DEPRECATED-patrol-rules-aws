var AWS = require('aws-sdk');
var message = require('lambda-cfn').message;
var splitOnComma = require('lambda-cfn').splitOnComma;
var getEnv = require('lambda-cfn').getEnv;
var util = require('util');

module.exports.config = {
  name: 'serviceLimits',
  sourcePath: 'rules/serviceLimits.js',
  parameters: {
    ignoredResources: {
      Type: 'String',
      Description: 'Comma separated list of ignored resourceIds for limit warnings'
    }
  },
  scheduledRule: 'rate(5 minutes)'
};

module.exports.fn = function(event, callback) {
  var ignored = splitOnComma(getEnv('ignoredResources'));

  var params = {
    checkId: 'eW7HH0l7J9'
  };

  var support = new AWS.Support({region: 'us-east-1'});

  support.describeTrustedAdvisorCheckResult(params, function(err, data) {
    if (err) return callback(null, err); // an error occurred
    var notIgnored = [];
    data.result.flaggedResources.forEach(function(key) {
      if (key.status != 'ok') {
        ignored.filter(function(resource) {
          if (!(key.resourceId.indexOf(resource) > -1)) {
            notIgnored.push(key);
          };
        });
      }
    });

    if (notIgnored.length > 0) {
      var warning = [];
      notIgnored.forEach(function(k, i) {
        warning[i] = util.format('Service: %s \n\nResource: %s \n\nRegion: %s \n\nLimit: %s \n\nCurrent: %s \n\n', k.metadata[1], k.metadata[2], k.metadata[0], k.metadata[3], k.metadata[4]);
      });

      if (notIgnored.length == 1) {
        var notif = {
          subject: util.format('Service limit warning for %s in %s', notIgnored[0].metadata[1], notIgnored[0].metadata[0]),
          summary: warning.join(''),
          event: notIgnored
        };
      } else {
        var notif = {
          subject: 'Service limit warning for multiple services',
          summary: warning.join(''),
          event: notIgnored
        };
      }

      message(notif, function(err, result) {
        callback(err, result);
      });
    } else {
      callback(null, 'No service limit warning found');
    }
  });
};
