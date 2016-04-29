'use strict';

var fs = require('fs');
var dot = require('dot');
var populationInAreaQuery = fs.readFileSync(__dirname + '/population-in-area.sql');

dot.templateSettings.strip = false;

var populationInAreaTemplate = dot.template(populationInAreaQuery);

module.exports = function buildQuery(it) {
    return populationInAreaTemplate(it);
};
