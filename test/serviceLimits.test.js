var test = require('tape');

var rule = require('../serviceLimits/function.js');
var fn = rule.fn;
var AWS = require('@mapbox/mock-aws-sdk-js');

var event = {};

test('No services limit warnings found', function(t) {
  AWS.stub('Support', 'describeTrustedAdvisorCheckResult', function(params, callback) {
    var data = {
      result:
      {
        flaggedResources: [
          {
            status: 'ok'
          }
        ]
      }
    };
    callback(null, data);
  });

  fn(event, {}, function(err, message) {
    t.error(err, 'No error when calling function');
    t.equal(message,'No service limit warning found');
    AWS.Support.restore();
    t.end();
  });
});


test('Single service limit warning found', function(t) {
  AWS.stub('Support', 'describeTrustedAdvisorCheckResult', function(params, callback) {
    var data = {
      result:
      {
        flaggedResources: [
          {
            metadata: [
              'us-west-1',
              'AutoScaling',
              'Auto Scaling groups',
              '20',
              '3',
              'Green'
            ],
            region: 'us-west-1',
            resourceId: 'D6t7gRjnfyfSCP-VE2wzAvvRxQfNm9ofQBFuQKfhE4Q',
            status: 'warning'
          }
        ]
      }
    };
    callback(null, data);
  });

  fn(event, {}, function(err,message) {
    t.error(err, 'No error when calling function');
    t.equal(message.subject,'Service limit warning for AutoScaling in us-west-1');
    AWS.Support.restore();
    t.end();
  });
});

test('Ignored service found', function(t) {
  process.env.ignoredResources = 'D6t7gRjnfyfSCP-VE2wzAvvRxQfNm9ofQBFuQKfhE4Q';
  AWS.stub('Support', 'describeTrustedAdvisorCheckResult', function(params, callback) {
    var data = {
      result:
      {
        flaggedResources: [
          {
            metadata: [
              'us-west-1',
              'AutoScaling',
              'Auto Scaling groups',
              '20',
              '3',
              'Green'
            ],
            region: 'us-west-1',
            resourceId: 'D6t7gRjnfyfSCP-VE2wzAvvRxQfNm9ofQBFuQKfhE4Q',
            status: 'warning'
          },
          {
            metadata: [
              'us-east-1',
              'EC2',
              'On-Demand instances - r3.xlarge ',
              '600',
              '2',
            ],
            region: 'us-east-1',
            resourceId: 'PKWkxXSFD8iToF9gK97U19t1F8HxqU_lzGDyjCBvGio',
            status: 'warning'
          }
        ]
      }
    };
    callback(null, data);
  });

  fn(event, {}, function(err,message) {
    t.error(err, 'does not error');
    t.equal(message.subject,'Service limit warning for EC2 in us-east-1');
    AWS.Support.restore();
    t.end();
  });
});

test('Multiple services in warning', function(t) {
  process.env.ignoredResources = '';
  AWS.stub('Support', 'describeTrustedAdvisorCheckResult', function(params, callback) {
    var data = {
      result:
      {
        flaggedResources: [
          {
            metadata: [
              'us-west-1',
              'AutoScaling',
              'Auto Scaling groups',
              '20',
              '3',
              'Green'
            ],
            region: 'us-west-1',
            resourceId: 'D6t7gRjnfyfSCP-VE2wzAvvRxQfNm9ofQBFuQKfhE4Q',
            status: 'warning'
          },
          {
            metadata: [
              'us-east-1',
              'EC2',
              'On-Demand instances - r3.xlarge ',
              '600',
              '2',
            ],
            region: 'us-east-1',
            resourceId: 'PKWkxXSFD8iToF9gK97U19t1F8HxqU_lzGDyjCBvGio',
            status: 'warning'
          }
        ]
      }
    };
    callback(null, data);
  });

  fn(event, {}, function(err,message) {
    t.error(err, 'does not error');
    t.equal(message.subject,'Service limit warning for multiple services');
    AWS.Support.restore();
    t.end();
  });
});
