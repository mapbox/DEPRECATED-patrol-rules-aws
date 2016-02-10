var tape = require('tape');
var lambdaCfn = require('../lib/lambda-cfn');

var parameters = lambdaCfn.parameters;
var lambda = lambdaCfn.lambda;
var policy = lambdaCfn.policy;
var streambotEnv = lambdaCfn.streambotEnv;
var cloudwatch = lambdaCfn.cloudwatch;

tape('Rule implementations', function(t) {
  var loaded = require('..');
  loaded.rules.forEach(function(rule) {
    t.equal(typeof rule.fn, 'function', 'rule exports fn as function');
    t.equal(typeof rule.config, 'object', 'rule exports config');
    t.notEqual(typeof rule.config.name, undefined, 'config name is defined');
  });

  t.end();
});


tape('parameter unit tests', function(t) {
  t.throws(
    function() {
      parameters({parameters: {a: {
        Description: 'foo'
      }}});
    }, /must contain Type property/, 'Fail when parameter lacks Type property'

  );

  t.throws(
    function() {
      parameters({parameters: {a: {
        Type: 'foo'
      }}});
    }, /must contain Description property/, 'Fail when parameter lacks Description property'

  );

  t.end();

});

tape('lambda unit tests', function(t) {

  t.throws(
    function() {
      lambda({});
    }, /name property required/, 'Fail when no name property'

  );

  var def = lambda({name: 'myHandler'});
  t.equal(def.Properties.Handler, 'index.myHandler', 'Lambda handler correctly named');
  t.end();

});

tape('policy unit tests', function(t) {
  var noPolicy = policy({});
  t.equal(noPolicy, undefined);

  t.throws(
    function() {
      policy({
        statements: []
      });
    }, /name property required for policy/, 'Fail in policy when no name property'

  );

  t.throws(
    function() {
      policy({
        name: 'myLambda',
        statements: 'myString'
      });
    }, /must be an array/, 'Fail when statements is not an array'

  );

  t.throws(
    function() {
      policy({
        name: 'myLambda',
        statements: [
          {
            "Action": [
              "s3:GetObject"
            ],
            "Resource": "arn:aws:s3:::mySuperDuperBucket"
          }
        ]
      });
    }, /statement must contain Effect/, 'Fail when statement contains no Effect'

  );

  t.throws(
    function() {
      policy({
        name: 'myLambda',
        statements: [
          {
            "Effect": "Allow",
            "Resource": "arn:aws:s3:::mySuperDuperBucket"
          }
        ]
      });
    }, /statement must contain Action or NotAction/,
      'Fail when statement does not contain Action or NotAction');

  t.throws(
    function() {
      policy({
        name: 'myLambda',
        statements: [
          {
            "Effect": "Allow",
            "Action": [
              "s3:GetObject"
            ]
          }
        ]
      });
    }, /statement must contain Resource or NotResource/,
      'Fail when statement does not contain Resource or NotResource');

  var myPolicy;

  t.doesNotThrow(
    function() {
      myPolicy = policy({
        name: 'myLambda',
        statements: [
          {
            "Effect": "Allow",
            "Action": [
              "s3:GetObject"
            ],
            "Resource": "arn:aws:s3:::mySuperDuperBucket"
          },
          {
            "Effect": "Allow",
            "NotAction": [
              "s3:GetObject"
            ],
            "NotResource": "arn:aws:s3:::mySuperDuperBucket"
          }
        ]
      });
    });

  t.equal(myPolicy.PolicyName, 'myLambda');
  t.deepEqual(myPolicy, {
    PolicyName: 'myLambda',
    PolicyDocument: {
      Statement: [
        {
          "Effect": "Allow",
          "Action": [
            "s3:GetObject"
          ],
          "Resource": "arn:aws:s3:::mySuperDuperBucket"
        },
        {
          "Effect": "Allow",
          "NotAction": [
            "s3:GetObject"
          ],
          "NotResource": "arn:aws:s3:::mySuperDuperBucket"
        }
      ]
    }
  });

  t.end();

});

tape('streambotEnv unit tests', function(t) {
  t.throws(
    function() {
      streambotEnv({});
    }, /name property required for streambotEnv/,
      'Fail in streambotEnv when no name property'

  );

  var noStreambotEnv;

  t.doesNotThrow(
    function() {
      noStreambotEnv = streambotEnv({name: 'myLambda'});
    }, null, 'Does not throw if no parameters');

  t.equal(noStreambotEnv, undefined, 'No streambotEnv if no parameters');

  var validStreambotEnv = streambotEnv({
    name: 'myFunction',
    parameters: {
      param1: {
        Type: 'String',
        Description: 'desc 1'
      },
      param2: {
        Type: 'String',
        Description: 'desc 2'
      }
    }
  });

  t.deepEqual(validStreambotEnv, {
      "Type": "Custom::StreambotEnv",
      "Properties": {
        "ServiceToken": {
          "Ref": "StreambotEnv"
        },
        "FunctionName": {
          "Ref": "myFunction"
        },
        "param1": {
          "Ref": "param1"
        },
        "param2": {
          "Ref": "param2"
        }
      }
    }
  );

  t.end();
});

tape('cloudwatch unit tests', function(t) {
  t.throws(
    function() {
      cloudwatch({});
    }, '/name property required/', 'Fail when no name property'
  );

  var alarms = cloudwatch({name: 'myFunction'});
  t.notEqual(alarms.myFunctionErrors, undefined, 'Errors alarm is set');
  t.notEqual(alarms.myFunctionNoInvocations, undefined, 'NoInvocations alarm is set');
  t.equal(
    alarms.myFunctionErrors.Properties.ComparisonOperator,
    'GreaterThanThreshold', 'Uses correct comparison');
  t.equal(
    alarms.myFunctionNoInvocations.Properties.ComparisonOperator,
    'LessThanThreshold', 'Uses correct comparison');
  t.equal(
    alarms.myFunctionErrors.Properties.MetricName,
    'Errors', 'Uses correct metric name');
  t.equal(
    alarms.myFunctionNoInvocations.Properties.MetricName,
    'Invocations', 'Uses correct metric name');

  t.end();

});
