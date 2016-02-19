var path = require('path');
var fs = require('fs');
var streambot = require('streambot');

module.exports = crowsnest;
module.exports.rules = [];

function crowsnest(config) {
  fs.readdirSync(config.rulesPath).forEach(function(file) {
    if (path.extname(file) == '.js') {
      var rule = require('./rules/' + file);
      module.exports.rules.push(rule);
      module.exports[rule.config.name] = streambot(rule.fn);
    }
  });

  return module.exports;

}
