module.exports = {};
module.exports.describeStacks = describeStacks;
var AWS = require('aws-sdk');
var queue = require('d3-queue').queue;
var message = require('lambda-cfn').message;
var splitOnComma = require('lambda-cfn').splitOnComma;
var getEnv = require('lambda-cfn').getEnv;
var util = require('util');
var allStacks = [];

module.exports.config = {
  name: 'updateRollbackFailed',
  sourcePath: 'rules/updateRollbackFailed.js',
  parameters: {
    includeResources: {
      Type: 'String',
      Description: 'Comma separated list of stacks which don\'t have production in their stackname'
    }
  },
  statements: [
    {
      Effect: 'Allow',
      Action: [
        'cloudformation:*'
      ],
      Resource: '*'
    }
  ],
  scheduledRule: 'rate(5 minutes)'
};

module.exports.fn = function(event, callback) {
  var productionStacks = [];
  var included = splitOnComma(getEnv('includeResources'));
  var q = queue(1);
  q.defer(describeStacks, {});
  q.awaitAll(function (err, data) {
    if (err) return callback(err);
    else {
        data[0].forEach(function(i) {
          if(i.name.indexOf('production') > -1  && i.status.indexOf('UPDATE_COMPLETE') > -1) {
            var notif = {
              subject: 'Production stack in UPDATE_ROLLBACK_FAILED',
              summary: 'Production stack'+ i +'in UPDATE_ROLLBACK_FAILED',
              event: i
            };
            message(notif, function(err, result) {
              callback(err, result);
            });
          }else {
            return callback(null, 'No service in UPDATE_ROLLBACK_FAILED');
          }
        });
      }
    });
};

function describeStacks(params, callback) {
  var q1 = queue(1);
  var cloudformation = new AWS.CloudFormation({region: 'us-east-1'});
  cloudformation.describeStacks(params, function(err, data) {
    if (err) return callback(err); 
    if (data.NextToken) {
      params.NextToken = data.NextToken;
      data.Stacks.forEach(function(i){
        allStacks.push({name:i.StackName, status:i.StackStatus});
      }); 
      q1.defer(describeStacks, params, callback);
    } else {
      data.Stacks.forEach(function(i){
        allStacks.push({name:i.StackName, status:i.StackStatus});
        return callback(null, allStacks);
      });
    }
    q1.awaitAll(function (err, data) {
      if (err) return callback(err);
      else {
        return callback(null, allStacks);
      }
    });
  });
}
