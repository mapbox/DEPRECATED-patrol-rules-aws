var path = require('path');
var fs = require('fs');
var streambot = require('streambot');
var root = process.env.LAMBDA_TASK_ROOT ?
  process.env.LAMBDA_TASK_ROOT :
  require('app-root-path').path;

var template;
module.exports.rules = [];
fs.readdirSync(path.join(root, 'cloudformation')).forEach(function(file) {
  if (path.extname(file) == '.js' && file.indexOf('.template.') > -1) {
    template = require(path.join(root, 'cloudformation', file));
    var fns = [];
    for (var i in template.Resources) {
      if (template.Resources[i].Type == 'AWS::Lambda::Function' &&
          template.Resources[i].Metadata &&
          template.Resources[i].Metadata.sourcePath) {
        var sourcePath = path.join(root, template.Resources[i].Metadata.sourcePath);
        var rule = require(sourcePath);
        module.exports[rule.config.name] = streambot(rule.fn);
        fns.push(template.Resources[i]);
      }
    }
  }
});
