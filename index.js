var streambot = require('streambot');

module.exports.rules = [
  require('./rules/myFunction'),
  require('./rules/otherFunction')
];

module.exports.rules.forEach(function(rule) {
  module.exports[rule.config.name] = streambot(rule.fn);
});
