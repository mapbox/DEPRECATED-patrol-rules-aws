var tape = require('tape');
var lambdaCfn = require('lambda-cfn');

var parameters = lambdaCfn.parameters;
var lambda = lambdaCfn.lambda;
var lambdaPermission = lambdaCfn.lambdaPermission;
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
