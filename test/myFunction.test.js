var test = require('tape');

var myFunction = require('../rules/myFunction');

test('example test', function(t) {
  t.equal(1, 1, 'ok');
  myFunction.fn({
    foo: 'bar'
  });
  t.end();
});
