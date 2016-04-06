'use strict';

var Node = require('../node');

var TYPE = 'population-in-area';
var PARAMS = {
    source: Node.PARAM.NODE(Node.GEOMETRY.POLYGON),
    final_column: Node.PARAM.STRING
};

var PopulationInArea = Node.create(TYPE, PARAMS, { cache: true });

module.exports = PopulationInArea;
module.exports.TYPE = TYPE;
module.exports.PARAMS = PARAMS;

PopulationInArea.prototype.sql = function() {
    return [
        'SELECT ',
        'CDB_Population(the_geom) as ' + this.final_column + ',',
        this.source.getColumns().join(','),
        'FROM (' + this.source.getQuery() + ') _cdb_create_cache_table'
    ].join('\n');
};
