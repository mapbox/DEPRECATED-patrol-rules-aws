#!/usr/bin/env node

var path = require('path');
var lambdaCfn = require('../lib/lambda-cfn');

if (!process.argv[2])
  throw new Error('Must provide path to rules');

var crowsnest = require('../index')({
  rulesPath: process.argv[2]
});

var rules = crowsnest.rules;
var built = [];

rules.forEach(function(rule) {
  built.push(lambdaCfn.build(rule.config));
});

var template = lambdaCfn.compile(built);

console.log(template);
