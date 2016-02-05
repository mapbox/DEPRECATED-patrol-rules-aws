// TODO autoload from ./rules
module.exports.rules = [
  require('./rules/myFunction'),
  require('./rules/otherFunction')
];

module.exports.rules.forEach(function(rule) {
  module.exports[rule.config.name] = rule.fn;
});
