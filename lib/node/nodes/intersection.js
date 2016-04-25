'use strict';

var dot = require('dot');
dot.templateSettings.strip = false;

var Node = require('../node');

var TYPE = 'intersection';
var PARAMS = {
    source_a: Node.PARAM.NODE,
    source_b: Node.PARAM.NODE
};

var Intersection = Node.create(TYPE, PARAMS);

module.exports = Intersection;
module.exports.TYPE = TYPE;
module.exports.PARAMS = PARAMS;


Intersection.prototype.sql = function() {
    return query({
        sourceA: this.source_a.getQuery(),
        sourceB: this.source_b.getQuery(),
        columnNames: this.source_a.getColumns()
    });
};

var queryTemplate = dot.template([
    'WITH',
    '_cdb_analysis_source_a AS (',
    ' {{=it.sourceA}}',
    '),',
    '_cdb_analysis_source_b AS (',
    ' {{=it.sourceB}}',
    ')',
    'SELECT {{=it.sourceAColumns}}',
    'FROM _cdb_analysis_source_a JOIN _cdb_analysis_source_b',
    'ON ST_Intersects(_cdb_analysis_source_b.the_geom, _cdb_analysis_source_a.the_geom)'
].join('\n'));

function query(it) {
    it.sourceAColumns = it.columnNames.map(function(name) { return '_cdb_analysis_source_a.' + name; }).join(', ');
    return queryTemplate(it);
}
