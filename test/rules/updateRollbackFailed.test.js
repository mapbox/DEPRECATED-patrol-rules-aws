var rule = require('../../rules/updateRollbackFailed');
var stacks = require('./fixtures/describeStack.json');
var test = require('tape');
var fn = rule.fn;
var name = rule.config.name;
var event = {};
var AWS = require('aws-sdk');
var originalCloudFormation = AWS.CloudFormation;
var originalSNS = AWS.SNS;

test('mocking cloudformation', function(t) {
AWS.CloudFormation = MockCloudFormation;
    function MockCloudFormation() {}
    MockCloudFormation.prototype.describeStacks = function (params, callback) {
        callback(null, stacks);
    };
	t.end();
});

test('Mock SNS publish', function (assert) {
    AWS.SNS = MockSNS;
    function MockSNS() {}

    MockSNS.prototype.publish = function (param, callback) {
        param = {
            Subject: 'Production stack in UPDATE_ROLLBACK_FAILED',
            Message: 'Production stack something-production in UPDATE_ROLLBACK_FAILED',
            event: 'something'
        };
        assert.deepEqual(typeof param, 'object', 'Parameter is an object.');
        assert.deepEqual(typeof param.Message, 'string', 'Parameter\'s message is a String.');
        assert.deepEqual(param.event, 'something', 'event matches');
        return callback(null, 'No service in UPDATE_ROLLBACK_FAILED');
    };
    assert.end();
});

test('update Rollback Failed check for production stacks', function(t) {
  fn(event, function(err, message) {
  	t.deepEquals(message, 'No service in UPDATE_ROLLBACK_FAILED', 'ok no stack in UPDATE_ROLLBACK_FAILED');
  	t.ifError(err);
  	t.end();
  });
});

test('[CloudFormation] restore', function(t) {
    AWS.CloudFormation = originalCloudFormation;
    t.end();
});

test('[SNS]', function (assert) {
    AWS.SNS = originalSNS;
    assert.end();
});