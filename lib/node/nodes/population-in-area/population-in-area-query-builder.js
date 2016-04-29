'use strict';

var fs = require('fs');
var dot = require('dot');
var populationInAreaQuery = fs.readFileSync(__dirname + '/population-in-area.sql');

dot.templateSettings.strip = false;

var populationInAreaTemplate = dot.template(populationInAreaQuery);

module.exports = function buildQuery(it) {
    it.columns = it.columns.join(', ');

    return populationInAreaTemplate(it);
};

// CDB_Population fake implementation
// ---------------------------------------------------------------------------
// CREATE FUNCTION CDB_Population(geometry) RETURNS numeric AS
// 'select (random() * 1e6)::numeric;'
// LANGUAGE SQL VOLATILE;
// ---------------------------------------------------------------------------
