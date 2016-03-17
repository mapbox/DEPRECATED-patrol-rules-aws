var AWS = require('aws-sdk');
var queue = require('queue-async');
var message = require('../lib/message');
var utils = require('../lib/utils');

var name = 'githubOrgMembership';

module.exports.config = {
    name: name,
    snsRule: {}
};

module.exports.fn = function(context, event, callback) {
    if (event) {
        console.log("Received webhook");
        var notif = {
            subject: 'Test hook on ' + this.functionName,
            summary: 'Test hook on ' + this.functionName,
            event: event
        };
        message(notif, function(err,result) {
            callback(err,result);
        });
    } else {
        callback(null,'Not called');
    }
};
