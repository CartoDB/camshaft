'use strict';

var fs = require('fs');
var dot = require('dot');
dot.templateSettings.strip = false;

module.exports.getTemplateFn = function (templatePath) {
    return dot.template(fs.readFileSync(templatePath));
};
