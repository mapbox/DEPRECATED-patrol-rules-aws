#!/usr/bin/env node

var lambdaCfn = require('../lib/lambda-cfn');

var rules = require('../index').rules;
var built = [];

rules.forEach(function(rule) {
  built.push(lambdaCfn.build(rule.config));
});

var template = lambdaCfn.compile(built);

console.log(template);
