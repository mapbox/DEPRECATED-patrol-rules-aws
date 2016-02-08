var path = require('path');
var fs = require('fs');
var streambot = require('streambot');

var rulesPath = path.join(__dirname, 'rules');

module.exports.rules = [];

fs.readdirSync(rulesPath).forEach(function(file) {
  if (path.extname(file) == '.js') {
    var rule = require('./rules/' + file);
    module.exports.rules.push(rule);
    module.exports[rule.config.name] = streambot(rule.fn);
  }
});
