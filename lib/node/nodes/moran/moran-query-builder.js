'use strict';

var fs = require('fs');
var dot = require('dot');
var moranQuery = fs.readFileSync(__dirname + '/moran.sql');

dot.templateSettings.strip = false;

var moranQueryTemplate = dot.template(moranQuery);

module.exports = function buildQuery(it) {
    return moranQueryTemplate(it);
};
