var AWS = require('aws-sdk');
var queue = require('queue-async');
var message = require('../lib/message');
var utils = require('../lib/utils');

var name = 'githubOrgMembership'

module.exports.config = {
    name: name,
    snsRule: {}
};

module.exports.fn = function(event, context, callback) {
    if (event) {
        var notif = {
            subject: 'Test hook on ' + context.functionName,
            summary: 'Test hook on ' + context.functionName,
            event: event
        };
        message(notif,function(err,results) {
            callback(err,result);
        });
    } else {
        callback(null,'Not called');
    }
};
