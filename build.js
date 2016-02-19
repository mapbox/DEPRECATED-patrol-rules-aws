var path = require('path');
var lambdaCfn = require('./lib/lambda-cfn');

var crowsnest = require('./index')({
  rulesPath: path.join(__dirname, 'rules')
});

var rules = crowsnest.rules;
var built = [];

rules.forEach(function(rule) {
  built.push(lambdaCfn.build(rule.config));
});

var template = lambdaCfn.compile(built);

console.log(template);
