var AWS = require('aws-sdk');

module.exports = function(message, callback) {

  if (process.env.NODE_ENV == 'test') {
    AWS.SNS = function() {};

    AWS.SNS.prototype.publish = function(params, callback) {
      callback(null, {
        MessageId: '1234'
      });
      return new events.EventEmitter();
    };
  } else {
    var sns = new AWS.SNS();
    var params = {
      Message: message,
      TopicArn: process.env.AlarmSNSTopic
    };
    sns.publish(params, function(err, data) {
      callback(err, data);
    });
  }

};
