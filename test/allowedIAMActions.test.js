var test = require('tape');

var code = require('../allowedIAMActions/function.js');
var fn = code.fn;

test('allowedIAMActions rule', (t) => {

  var event = {
    'detail': {
      'userIdentity': {
        'sessionContext': {
          'sessionIssuer': {
            'userName': 'bob'
          }
        }
      },
      'requestParameters': {
        'policyArn': 'arn:aws:iam::12345678901:role/Administrator-123456'
      }
    }
  };

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
          'iam:*'
        ]
      },
      {
        Effect: 'Allow',
        Action: [
          'ec2:*'
        ]
      },
      {
        Effect: 'Allow',
        Action: [
          'iam:PutUserPolicy'
        ]
      },
    ]
  };


  event.detail.requestParameters.policyDocument = JSON.stringify(docMixed);

  process.env.allowedActions = 'iam:PassRole';
  process.env.restrictedServices = 'iam, cloudtrail';

  fn(event, {}, (err, message) => {
    t.error(err, 'does not error');
    t.equal(message.subject, 'Disallowed actions used in policy',
      'Alarms on multiple disallowed subject matches');
    t.equal(message.summary, 'Disallowed actions cloudtrail:* iam:* iam:PutUserPolicy used in policy',
      'Alarms on multiple disallowed summary matches');
  });

  var docAllowedRestricted = {
    Statement: [
      {
        Effect: 'Allow',
        Action: [
          'iam:PassRole'
        ]
      },
      {
        Effect: 'Allow',
        Action: [
          'iam:PutUserPolicy'
        ]
      },
    ]
  };

  event.detail.requestParameters.policyDocument = JSON.stringify(docAllowedRestricted);

  fn(event, {}, (err, message) => {
    t.error(err, 'does not error');
    t.equal(message.subject, 'Disallowed actions used in policy',
      'Alarms on multiple disallowed subject matches');
    t.equal(message.summary, 'Disallowed actions iam:PutUserPolicy used in policy',
      'Alarms on multiple disallowed summary matches');
  });

  var docAllowed = {
    Statement: [
      {
        Effect: 'Allow',
        Action: [
          'iam:PassRole'
        ]
      }
    ]
  };

  event.detail.requestParameters.policyDocument = JSON.stringify(docAllowed);

  fn(event, {}, (err, _message) => {
    t.error(err, 'does not error');
    t.equal(undefined, undefined, 'No alarm on allowed action');
  });

  event = {
    'detail': {
      errorCode: 'AccessDenied',
      errorMessage: 'This is the error message'
    }
  };

  fn(event, {}, (err, message) => {
    t.error(err, 'No error when calling allowedIAMActions');
    t.equal(message, 'This is the error message',
      'errorMessage is returned in callback');
  });

  var docNonArray = {
    Statement: {
      Effect: 'Allow',
      Action: [
        'iam:PutUserPolicy'
      ]
    }
  };

  event = {
    'detail': {
      'userIdentity': {
        'sessionContext': {
          'sessionIssuer': {
            'userName': 'bob'
          }
        }
      },
      'requestParameters': {
        'policyArn': 'arn:aws:iam::12345678901:role/Administrator-123456'
      }
    }
  };

  event.detail.requestParameters.policyDocument = JSON.stringify(docNonArray);

  fn(event, {}, (err, message) => {
    t.error(err, 'does not error');
    t.equal(message.subject, 'Disallowed actions used in policy',
      'Alarms on single non-array disallowed subject match');
    t.equal(message.summary, 'Disallowed actions iam:PutUserPolicy used in policy',
      'Alarms on single non-array disallowed summary match');
  });

  process.env.ignoredRolePolicy = 'ROLE:Policy';

  fn(event, {}, (err, message) => {
    t.error(err, 'does not error');
    t.equal(message.subject, 'Disallowed actions used in policy', 'Role:Policy, correctly, does not match');
  });

  process.env.ignoredRolePolicy = 'BOB:Adminis';

  fn(event, {}, (err, message) => {
    t.error(err, 'does not error');
    t.equal(message, 'Matched role \'bob\' and policyArn \'arn:aws:iam::12345678901:role/Administrator-123456\' to ignoredRolePolicy value \'BOB:Adminis\', skipping', 'Role:Policy matches correctly');
  });

  process.env.ignoredRolePolicy = 'jaNe:Super,BOB:Adminis';

  fn(event, {}, (err, message) => {
    t.error(err, 'does not error');
    t.equal(message, 'Matched role \'bob\' and policyArn \'arn:aws:iam::12345678901:role/Administrator-123456\' to ignoredRolePolicy value \'BOB:Adminis\', skipping', 'Multiple Role:Policy, with one match, passes correctly');
  });

  t.end();
});
