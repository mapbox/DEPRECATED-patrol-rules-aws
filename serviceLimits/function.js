var AWS = require('aws-sdk');
var message = require('@mapbox/lambda-cfn').message;
var splitOnComma = require('@mapbox/lambda-cfn').splitOnComma;
var util = require('util');

module.exports.fn = function(event, context, callback) {
  var ignored = splitOnComma(process.env.ignoredResources);

  var params = {
    checkId: 'eW7HH0l7J9'
  };

  var support = new AWS.Support({region: 'us-east-1'});

  support.describeTrustedAdvisorCheckResult(params, function(err, data) {
    if (err) return callback(err); // an error occurred
    var notIgnored = [];
    data.result.flaggedResources.forEach(function(key) {
      if (key.status != 'ok') {
        if (ignored) {
          ignored.filter(function(resource) {
            if (!(key.resourceId.indexOf(resource) > -1)) {
              notIgnored.push(key);
            };
          });
        } else {
          notIgnored.push(key);
        }
      }
    });

    if (notIgnored.length > 0) {
      var warning = [];
      notIgnored.forEach(function(k, i) {
        warning[i] = util.format('Service: %s \nResource: %s \nRegion: %s \nLimit: %s \nCurrent: %s \nResourceId: %s\n\n', k.metadata[1], k.metadata[2], k.metadata[0], k.metadata[3], k.metadata[4], k.resourceId);
      });

      if (notIgnored.length == 1) {
        if (notIgnored[0].metadata[0] == '-') {
          var region = 'all regions';
        } else {
          var region = notIgnored[0].metadata[0];
        }

        var notif = {
          subject: util.format('Service limit warning for %s in %s', notIgnored[0].metadata[1], region),
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
