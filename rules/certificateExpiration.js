var test = require('tape');
var AWS = require('aws-sdk');
var message = require('lambda-cfn');
var iam = new AWS.IAM();
var days = 60 * 60 * 24 * 30;

module.exports.fn = function(event, callback) {
  getCertificates(function(err, data) {
    if (err) return callback(err, null);
    getExpiringCertificates(data.ServerCertificateMetadataList, function(err, listCert) {
      if (listCert.length > 0) {
        var notif = {
          subject: 'Expired Certificates.',
          summary: 'Patrol detected  Expired Certificates.',
          list: listCert
        };
        message(notif, function(err, result) {
          callback(err, result);
        });
      } else {
        callback(null, ' There are not Expired Certificates.');
      }
    });

  });
};

var getExpiringCertificates = function(listCert, callback) {
  var expiredCertificates = [];
  var now = Math.floor((new Date()).getTime() / 1000);
  for (var i = 0; i < listCert.length; i++) {
    var cert = listCert[i];
    var timestamp = (new Date(cert.Expiration).getTime()) / 1000;
    if (timestamp - now < days) {
      expiredCertificates.push(cert);
    }
  }

  callback(null, expiredCertificates);
}

function getCertificates(callback) {
  iam.listServerCertificates({}, function(err, data) {
    if (err) callback(err, null);
    callback(null, data);
  });
}

module.exports.getExpiringCertificates = getExpiringCertificates;
