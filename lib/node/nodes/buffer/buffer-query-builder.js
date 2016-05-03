'use strict';

var fs = require('fs');
var dot = require('dot');
var bufferQuery = fs.readFileSync(__dirname + '/buffer.sql');

dot.templateSettings.strip = false;

var bufferQueryTemplate = dot.template(bufferQuery);

module.exports = function buildQuery(it) {
    it.columns = it.columns.join(', ');

    return bufferQueryTemplate(it);
};
