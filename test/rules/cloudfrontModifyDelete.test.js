var test = require('tape');

var rule = require('../../rules/cloudfrontModifyDelete');
var fn = rule.fn;
var name = rule.config.name;

test('cloudfrontModifyDelete rule', function(t) {

  process.env.protectedEvents = 'UpdateDistribution, DeleteDistribution';
  process.env.protectedDistributions = 'ABCD1234FGHJ56';

  var updateDistributionEvent = {
    "detail": {
      "eventSource": "cloudfront.amazonaws.com",
      "eventName": "UpdateDistribution",
      "requestParameters": {
        "id": "NOTPROTECTED"
      }
    }
  };

  fn(updateDistributionEvent, function(err, message) {
    t.error(err, 'No error when calling ' + name);
    t.deepEqual(message, 'Protected CloudFront distribution was not updated', 
      'Does not match protected CloudFront distribution');
  });

  var allowedDistributionEvent = {
    "detail": {
      "eventSource": "cloudfront.amazonaws.com",
      "eventName": "CreateInvalidation",
      "requestParameters": {
        "id": "ABCD1234FGHJ56"
      }
    }
  };

  fn(allowedDistributionEvent, function(err, message) {
    t.deepEqual(message, 'Protected CloudFront event was not called', 
      'Protected CloudFront event was not called');
  });

  var updateProtectedDistributionEvent = {
    "detail": {
      "eventSource": "cloudfront.amazonaws.com",
      "eventName": "UpdateDistribution",
      "requestParameters": {
        "id": "ABCD1234FGHJ56"
      }
    }
  };

  fn(updateProtectedDistributionEvent, function(err, message) {
    t.deepEqual(message, {
      body: 'UpdateDistribution called on protected CloudFront distribution ABCD1234FGHJ56',
      subject: 'UpdateDistribution called on protected CloudFront distribution ABCD1234FGHJ56'
    }, 'Matches UpdateDistribution event against protected CloudFront distribution');
  });

  var deleteProtectedDistributionEvent = {
    "detail": {
      "eventSource": "cloudfront.amazonaws.com",
      "eventName": "DeleteDistribution",
      "requestParameters": {
        "id": "ABCD1234FGHJ56"
      }
    }
  };

  fn(deleteProtectedDistributionEvent, function(err, message) {
    t.deepEqual(message, {
      body: 'DeleteDistribution called on protected CloudFront distribution ABCD1234FGHJ56',
      subject: 'DeleteDistribution called on protected CloudFront distribution ABCD1234FGHJ56'
    }, 'Matches DeleteDistribution event against protected CloudFront distribution');
  });

  var event = {
    "detail": {
      errorCode: "AccessDenied",
      errorMessage: "This is the error message"
    }
  };

  fn(event, function(err, message) {
    t.error(err, 'No error when calling ' + name);
    t.equal(message, 'This is the error message',
      'errorMessage is returned in callback');
  });

  t.end();

});
