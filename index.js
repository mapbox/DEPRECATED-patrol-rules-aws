var lambdaCfn = require('./lib/lambda-cfn');
var myFunction = require('./lib/myFunction');
var otherFunction = require('./lib/otherFunction');

var template = lambdaCfn.compile([
  myFunction,
  otherFunction
]);

console.log(template);
