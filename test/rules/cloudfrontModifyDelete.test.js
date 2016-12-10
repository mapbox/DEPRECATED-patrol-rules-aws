var test = require('tape');

var rule = require('../../rules/cloudfrontModifyDelete');
var fn = rule.fn;
var name = rule.config.name;

test('cloudfrontModifyDelete rule', function(t) {

  process.env.protectedActions = 'UpdateDistribution, DeleteDistribution';
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

  fn(updateDistributionEvent, null, function(err, message) {
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

  fn(allowedDistributionEvent, null, function(err, message) {
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

  fn(updateProtectedDistributionEvent, null, function(err, message) {
    t.deepEqual(message, {
      subject: 'UpdateDistribution called on protected CloudFront distribution ABCD1234FGHJ56',
      summary: 'UpdateDistribution called on protected CloudFront distribution ABCD1234FGHJ56',
      event: {
        "detail": {
          "eventSource": "cloudfront.amazonaws.com",
          "eventName": "UpdateDistribution",
          "requestParameters": {
            "id": "ABCD1234FGHJ56"
          }
        }
      }
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

  fn(deleteProtectedDistributionEvent, null, function(err, message) {
    t.deepEqual(message, {
      subject: 'DeleteDistribution called on protected CloudFront distribution ABCD1234FGHJ56',
      summary: 'DeleteDistribution called on protected CloudFront distribution ABCD1234FGHJ56',
      event: {
        "detail": {
          "eventSource": "cloudfront.amazonaws.com",
          "eventName": "DeleteDistribution",
          "requestParameters": {
            "id": "ABCD1234FGHJ56"
          }
        }
      }
    }, 'Matches DeleteDistribution event against protected CloudFront distribution');
  });

  var event = {
    "detail": {
      errorCode: "AccessDenied",
      errorMessage: "This is the error message"
    }
  };

  fn(event, null, function(err, message) {
    t.error(err, 'No error when calling ' + name);
    t.equal(message, 'This is the error message',
      'errorMessage is returned in callback');
  });

  t.end();

});
