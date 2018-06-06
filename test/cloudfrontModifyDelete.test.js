var test = require('tape');

var rule = require('../cloudfrontModifyDelete/function.js');
var fn = rule.fn;

test('cloudfrontModifyDelete rule', function(t) {

  process.env.protectedActions = 'UpdateDistribution, DeleteDistribution';
  process.env.protectedDistributions = 'ABCD1234FGHJ56';

  var updateDistributionEvent = {
    'detail': {
      'userIdentity': {
        'arn': 'arn:aws:sts::12345657890:assumed-role/SomeRole/SomeUser'
      },
      'eventSource': 'cloudfront.amazonaws.com',
      'eventName': 'UpdateDistribution',
      'requestParameters': {
        'id': 'NOTPROTECTED'
      }
    }
  };

  fn(updateDistributionEvent, {}, function(err, message) {
    t.error(err, 'No error when calling function');
    t.deepEqual(message, 'Protected CloudFront distribution was not updated',
      'Does not match protected CloudFront distribution');
  });

  var allowedDistributionEvent = {
    'detail': {
      'userIdentity': {
        'arn': 'arn:aws:sts::12345657890:assumed-role/SomeRole/SomeUser'
      },
      'eventSource': 'cloudfront.amazonaws.com',
      'eventName': 'CreateInvalidation',
      'requestParameters': {
        'id': 'ABCD1234FGHJ56'
      }
    }
  };

  fn(allowedDistributionEvent, {}, function(err, message) {
    t.error(err, 'does not error');
    t.deepEqual(message, 'Protected CloudFront event was not called',
      'Protected CloudFront event was not called');
  });

  var updateProtectedDistributionEvent = {
    'detail': {
      'userIdentity': {
        'arn': 'arn:aws:sts::12345657890:assumed-role/SomeRole/SomeUser'
      },
      'eventSource': 'cloudfront.amazonaws.com',
      'eventName': 'UpdateDistribution',
      'requestParameters': {
        'id': 'ABCD1234FGHJ56'
      }
    }
  };

  fn(updateProtectedDistributionEvent, {}, function(err, message) {
    t.error(err, 'does not error');
    t.deepEqual(message, {
      subject: 'UpdateDistribution called on protected CloudFront distribution ABCD1234FGHJ56 by SomeUser',
      summary: 'UpdateDistribution called on protected CloudFront distribution ABCD1234FGHJ56 by SomeUser',
      event: {
        'detail': {
          'userIdentity': {
            'arn': 'arn:aws:sts::12345657890:assumed-role/SomeRole/SomeUser'
          },
          'eventSource': 'cloudfront.amazonaws.com',
          'eventName': 'UpdateDistribution',
          'requestParameters': {
            'id': 'ABCD1234FGHJ56'
          }
        }
      }
    }, 'Matches UpdateDistribution event against protected CloudFront distribution');
  });

  var deleteProtectedDistributionEvent = {
    'detail': {
      'userIdentity': {
        'arn': 'arn:aws:sts::12345657890:assumed-role/SomeRole/SomeUser'
      },
      'eventSource': 'cloudfront.amazonaws.com',
      'eventName': 'DeleteDistribution',
      'requestParameters': {
        'id': 'ABCD1234FGHJ56'
      }
    }
  };

  fn(deleteProtectedDistributionEvent, {}, function(err, message) {
    t.error(err, 'does not error');
    t.deepEqual(message, {
      subject: 'DeleteDistribution called on protected CloudFront distribution ABCD1234FGHJ56 by SomeUser',
      summary: 'DeleteDistribution called on protected CloudFront distribution ABCD1234FGHJ56 by SomeUser',
      event: {
        'detail': {
          'userIdentity': {
            'arn': 'arn:aws:sts::12345657890:assumed-role/SomeRole/SomeUser'
          },
          'eventSource': 'cloudfront.amazonaws.com',
          'eventName': 'DeleteDistribution',
          'requestParameters': {
            'id': 'ABCD1234FGHJ56'
          }
        }
      }
    }, 'Matches DeleteDistribution event against protected CloudFront distribution');
  });

  var event = {
    'detail': {
      errorCode: 'AccessDenied',
      errorMessage: 'This is the error message'
    }
  };

  fn(event, {}, function(err, message) {
    t.error(err, 'No error when calling function');
    t.equal(message, 'This is the error message',
      'errorMessage is returned in callback');
  });

  var noUserIdentityArnEvent = {
    'detail': {
      'userIdentity': {
        'sessionContext': {
          'sessionIssuer': {
            'arn': 'arn:aws:sts::12345657890:role/SomeRole'
          }
        }
      },
      'eventSource': 'cloudfront.amazonaws.com',
      'eventName': 'UpdateDistribution',
      'requestParameters': {
        'id': 'ABCD1234FGHJ56'
      }
    }
  };

  fn(noUserIdentityArnEvent, {}, function(err, message) {
    t.error(err, 'does not error');
    t.deepEqual(message, {
      subject: 'UpdateDistribution called on protected CloudFront distribution ABCD1234FGHJ56 by role/SomeRole',
      summary: 'UpdateDistribution called on protected CloudFront distribution ABCD1234FGHJ56 by role/SomeRole',
      event: {
        'detail': {
          'userIdentity': {
            'sessionContext': {
              'sessionIssuer': {
                'arn': 'arn:aws:sts::12345657890:role/SomeRole'
              }
            }
          },
          'eventSource': 'cloudfront.amazonaws.com',
          'eventName': 'UpdateDistribution',
          'requestParameters': {
            'id': 'ABCD1234FGHJ56'
          }
        }
      }
    }, 'Generates default alarm topic email to sessionIssuer arn');
  });

  var noUserIdentityEvent = {
    'detail': {
      'eventSource': 'cloudfront.amazonaws.com',
      'eventName': 'UpdateDistribution',
      'requestParameters': {
        'id': 'ABCD1234FGHJ56'
      }
    }
  };

  process.env.DispatchSnsArn = 'someSnsArn';
  fn(noUserIdentityEvent, {}, function(err, message) {
    t.error(err, 'does not error');
    t.deepEqual(message, {
      type: 'broadcast',
      retrigger: 'false',
      users: [ { slackId: '' } ],
      body: {
        github: {
          title: 'UpdateDistribution called on protected CloudFront distribution ABCD1234FGHJ56 by unknown',
          body: 'UpdateDistribution called on protected CloudFront distribution ABCD1234FGHJ56 by unknown \n\n\n {"detail":{"eventSource":"cloudfront.amazonaws.com","eventName":"UpdateDistribution","requestParameters":{"id":"ABCD1234FGHJ56"}}}' },
        slack: {
          message: 'UpdateDistribution called on protected CloudFront distribution ABCD1234FGHJ56 by unknown'
        }
      }
    }, 'Generates dispatch message when DispatchSnsArn is set');
  });

  delete process.env.DispatchArn;
  t.end();
});
