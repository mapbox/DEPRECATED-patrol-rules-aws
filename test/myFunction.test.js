var test = require('tape');

var context = {
  succeed: function() {}
};

var myFunction = require('../rules/myFunction');

myFunction.fn = myFunction.fn.bind(context);

test('example test', function(t) {
  t.equal(1, 1, 'ok');
  myFunction.fn({
    foo: 'bar'
  });
  t.end();
});
