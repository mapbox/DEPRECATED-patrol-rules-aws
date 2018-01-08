const test = require('tape');

const rule = require('../serviceLimits/function.js');
const fn = rule.fn;

test('Found service limits warning', (t) => {
  let event = {
    'detail': {
      'check-name': 'Auto Scaling Groups',
      'check-item-detail': '',
    },
    'region': 'us-west-1',
    'resource_id': '',
    'status': 'WARN'
  };

  fn(event, {}, (error, message) => {
    t.equal(message.subject, 'Service Limit Warning for Auto Scaling Groups in us-west-1');
    t.end();
  });
});

test('No service limits warning in event', (t) => {
  let event = {
    'detail': {
      'check-name': 'Auto Scaling Groups',
      'check-item-detail': {
      },
    },
    'region': 'us-west-1',
    'resource_id': 'D6t7gRjnfyfSCP-VE2wzAvvRxQfNm9ofQBFuQKfhE4Q',
    'status': 'OK'
  };

  fn(event, {}, (error, message) => {
    t.equal(message, 'No Service Limit Warning');
    t.end();
  });
});
