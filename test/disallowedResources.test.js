var test = require('tape');
var AWS = require('@mapbox/mock-aws-sdk-js');

var rule = require('../disallowedResources/function.js');
var fn = rule.fn;

process.env.disallowedResourceArns = 'arn:aws:s3:::foo/bar/baz, arn:aws:s3:::foo/bar';

var eventFixture = {
  'detail': {
    'userIdentity': {
      'userName': 'bob'
    },
    'requestParameters': {
      'roleArn': 'arn:aws:iam::12345678901:role/Administrator-123456',
      'roleSessionName': 'bob'
    }
  }
};

test('disallowedResources no matches', function(t) {
  var docNoMatch = {
    Statement: [
      {
        Effect: 'Allow',
        Action: [
          'cloudtrail:*'
        ]
      },
    ]
  };
  var event = eventFixture;
  event.detail.requestParameters.policyDocument = JSON.stringify(docNoMatch);

  fn(event, {}, function(err, message) {
    t.error(err, 'No error when calling function');
    t.deepEqual(message, [], 'No matched disallowed resources');
    t.end();
  });
});

test('disallowedResources one statement one match', function(t) {
  var docMatch = {
    Statement: [
      {
        Effect: 'Allow',
        Action: [
          's3:*'
        ],
        Resource: [
          '*'
        ]
      },
    ]
  };
  var event = eventFixture;
  event.detail.requestParameters.policyDocument = JSON.stringify(docMatch);

  AWS.stub('IAM', 'simulateCustomPolicy', function(params, callback) {
    var data = {
      EvaluationResults: [
        {
          EvalResourceName: params.ResourceArns,
          EvalDecision: 'allowed'
        }

      ]
    };
    callback(null, data);
  });

  fn(event, {}, function(err, message) {
    t.error(err, 'does not error');
    t.equal(message.length, 1, 'There is only one result');
    t.equal(message[0].subject,
      'Policy allows access to disallowed resources',
      'Matches disallowed resources');
    t.equal(message[0].summary,
      'Policy allows access to disallowed resources: arn:aws:s3:::foo/bar/baz, arn:aws:s3:::foo/bar',
      'summary lists matched disallowed resources');
    AWS.IAM.restore();
    t.end();
  });
});

test('disallowedResources one non-array statement', function(t) {
  var docMatch = {
    Statement:
    {
      Effect: 'Allow',
      Action: [
        's3:*'
      ],
      Resource: [
        '*'
      ]
    }
  };
  var event = eventFixture;
  event.detail.requestParameters.policyDocument = JSON.stringify(docMatch);

  AWS.stub('IAM', 'simulateCustomPolicy', function(params, callback) {
    var data = {
      EvaluationResults: [
        {
          EvalResourceName: params.ResourceArns,
          EvalDecision: 'allowed'
        }

      ]
    };
    callback(null, data);
  });

  fn(event, {}, function(err, message) {
    t.error(err, 'does not error');
    t.equal(message.length, 1, 'There is only one result');
    t.equal(message[0].subject,
      'Policy allows access to disallowed resources',
      'Matches disallowed resources');
    t.equal(message[0].summary,
      'Policy allows access to disallowed resources: arn:aws:s3:::foo/bar/baz, arn:aws:s3:::foo/bar',
      'summary lists matched disallowed resources');
    AWS.IAM.restore();
    t.end();
  });
});


test('disallowedResources two statements one match', function(t) {
  var docMixed = {
    Statement: [
      {
        Effect: 'Allow',
        Action: [
          'cloudtrail:*'
        ]
      },
      {
        Effect: 'Allow',
        Action: [
          's3:*'
        ],
        Resource: [
          '*'
        ]
      }
    ]
  };

  var event = eventFixture;
  event.detail.requestParameters.policyDocument = JSON.stringify(docMixed);
  AWS.stub('IAM', 'simulateCustomPolicy', function(params, callback) {
    var data = {
      EvaluationResults: [
        {
          EvalResourceName: params.ResourceArns,
          EvalDecision: 'allowed'
        }

      ]
    };
    callback(null, data);
  });

  fn(event, {}, function(err, message) {
    t.error(err, 'does not error');
    t.equal(message.length, 1, 'There is only one result');
    t.equal(message[0].subject,
      'Policy allows access to disallowed resources',
      'No matched disallowed resources');
    t.equal(message[0].summary,
      'Policy allows access to disallowed resources: arn:aws:s3:::foo/bar/baz, arn:aws:s3:::foo/bar',
      'subject lists matched disallowed resources');
    AWS.IAM.restore();
    t.end();
  });
});

test('disallowedResources fuzzy match', function(t) {
  var docFuzzyMatch = {
    Statement: [
      {
        Effect: 'Allow',
        Action: [
          'cloudtrail:*'
        ]
      },
      {
        Effect: 'Allow',
        Action: [
          's3:*'
        ],
        Resource: [
          'arn:aws:s3:::fo*'
        ]
      }
    ]
  };
  var event = eventFixture;
  event.detail.requestParameters.policyDocument = JSON.stringify(docFuzzyMatch);

  AWS.stub('IAM', 'simulateCustomPolicy', function(params, callback) {
    var data = {
      EvaluationResults: [
        {
          EvalResourceName: params.ResourceArns,
          EvalDecision: 'allowed'
        }

      ]
    };
    callback(null, data);
  });

  fn(event, {}, function(err, message) {
    t.error(err, 'does not error');
    t.equal(message.length, 1, 'There is only one result');
    t.equal(message[0].subject,
      'Policy allows access to disallowed resources',
      'Matches fuzzy match S3 disallowed resources');
    AWS.IAM.restore();
    t.end();
  });
});

test('disallowedResources two statements one fuzzy match', function(t) {
  var docKinesisMatch = {
    Statement: [
      {
        Effect: 'Allow',
        Action: [
          'cloudtrail:*'
        ]
      },
      {
        Effect: 'Allow',
        Action: [
          'kinesis:*'
        ],
        Resource: [
          'arn:aws:kinesis:us-east-1:123456789012:stream/*-bar-*'
        ]
      }
    ]
  };

  var event = eventFixture;
  event.detail.requestParameters.policyDocument = JSON.stringify(docKinesisMatch);
  process.env.disallowedResourceArns = 'arn:aws:kinesis:us-east-1:123456789012:stream/foo-bar-KinesisStream-ABC*, arn:aws:s3:::foo/bar';

  AWS.stub('IAM', 'simulateCustomPolicy', function(params, callback) {
    var data = {
      EvaluationResults: [
        {
          EvalResourceName: params.ResourceArns,
          EvalDecision: 'allowed'
        }

      ]
    };
    callback(null, data);
  });


  fn(event, {}, function(err, message) {
    t.error(err, 'does not error');
    t.equal(message.length, 1, 'There is only one result');
    t.equal(message[0].subject,
      'Policy allows access to disallowed resources',
      'Matches kinesis disallowed resources');
    t.equal(message[0].summary,
      'Policy allows access to disallowed resources: arn:aws:kinesis:us-east-1:123456789012:stream/foo-bar-KinesisStream-ABC*',
      'subject lists matched disallowed resources');
    AWS.IAM.restore();
    t.end();
  });
});

test('disallowedResources three statements two matches', function(t) {
  var docTwoMatches = {
    Statement: [
      {
        Effect: 'Allow',
        Action: [
          'cloudtrail:*'
        ]
      },
      {
        Effect: 'Allow',
        Action: [
          'kinesis:*'
        ],
        Resource: [
          'arn:aws:kinesis:us-east-1:123456789012:stream/foo*'
        ]
      },
      {
        Effect: 'Allow',
        Action: [
          's3:*'
        ],
        Resource: [
          '*'
        ]
      }
    ]
  };

  var event = eventFixture;
  event.detail.requestParameters.policyDocument = JSON.stringify(docTwoMatches);
  process.env.disallowedResourceArns = 'arn:aws:kinesis:us-east-1:123456789012:stream/foo-bar-KinesisStream-ABC*, arn:aws:s3:::foo/bar';

  AWS.stub('IAM', 'simulateCustomPolicy', function(params, callback) {
    var data = {
      EvaluationResults: [
        {
          EvalResourceName: params.ResourceArns,
          EvalDecision: 'allowed'
        }

      ]
    };
    callback(null, data);
  });

  fn(event, {}, function(err, message) {
    t.error(err, 'does not error');
    t.equal(message.length, 1, 'There is only one result');
    t.equal(message[0].subject,
      'Policy allows access to disallowed resources',
      'Matches kinesis and s3 disallowed resources');
    t.equal(message[0].summary,
      'Policy allows access to disallowed resources: arn:aws:kinesis:us-east-1:123456789012:stream/foo-bar-KinesisStream-ABC*, arn:aws:s3:::foo/bar',
      'subjectFull lists matched disallowed resources');
    AWS.IAM.restore();
    t.end();
  });
});

test('disallowedResources AccessDenied', function(t) {
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
    t.end();
  });

});
