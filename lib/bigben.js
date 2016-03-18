var message = require('../lib/message');
var utils = require('../lib/utils');

var now = new Date();

module.exports.config = {
    name: 'bigben',
    scheduledRule: 'cron(0/5 * * * ? *)'
};


module.exports.fn = function(event, callback) {
    console.log((new Date()).toISOString() + ' running ' + this.functionName);
    return callback();
};
