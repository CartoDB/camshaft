'use strict';

var fs = require('fs');
var dot = require('dot');
var tradeAreaQuery = fs.readFileSync(__dirname + '/trade-area.sql');
var tradeAreaDissolvedQuery = fs.readFileSync(__dirname + '/trade-area-dissolved.sql');

dot.templateSettings.strip = false;

var tradeAreaQueryTemplate = dot.template(tradeAreaQuery);
var tradeAreaDissolvedQueryTemplate = dot.template(tradeAreaDissolvedQuery);

module.exports = function buildQuery(it) {
    it.columnsQuery = it.columnsQuery.join(', ');
    it.isolines = it.isolines.join(', ');

    if (it.dissolved) {
        return tradeAreaDissolvedQueryTemplate(it);
    }

    return tradeAreaQueryTemplate(it);
};
