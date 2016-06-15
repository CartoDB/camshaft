'use strict';

var Node = require('../node');

var TYPE = 'population-in-area';
var PARAMS = {
    source: Node.PARAM.NODE(Node.GEOMETRY.POLYGON),
    final_column: Node.PARAM.STRING()
};

var PopulationInArea = Node.create(TYPE, PARAMS, { cache: true });

module.exports = PopulationInArea;
module.exports.TYPE = TYPE;
module.exports.PARAMS = PARAMS;

PopulationInArea.prototype.sql = function() {
    var _columns = [
        'CDB_Population(the_geom) as ' + this.final_column
    ].concat(this.source.getColumns());
    return [
        'SELECT',
        _columns.join(','),
        'FROM (' + this.source.getQuery() + ') _camshaft_population_in_area'
    ].join('\n');
};

// CDB_Population fake implementation
// ---------------------------------------------------------------------------
// CREATE FUNCTION CDB_Population(geometry) RETURNS numeric AS
// 'select (random() * 1e6)::numeric;'
// LANGUAGE SQL VOLATILE;
// ---------------------------------------------------------------------------
