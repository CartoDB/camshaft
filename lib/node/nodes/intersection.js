'use strict';

var dot = require('dot');
dot.templateSettings.strip = false;

var Node = require('../node');

var TYPE = 'intersection';
var PARAMS = {
    source: Node.PARAM.NODE,
    target: Node.PARAM.NODE
};

var Intersection = Node.create(TYPE, PARAMS);

module.exports = Intersection;
module.exports.TYPE = TYPE;
module.exports.PARAMS = PARAMS;


Intersection.prototype.sql = function() {
    return query({
        sourceQuery: this.source.getQuery(),
        targetQuery: this.target.getQuery(),
        columnNames: this.source.getColumns()
    });
};

var queryTemplate = dot.template([
    'WITH',
    '_cdb_analysis_source AS (',
    ' {{=it.sourceQuery}}',
    '),',
    '_cdb_analysis_target AS (',
    ' {{=it.targetQuery}}',
    ')',
    'SELECT {{=it.sourceQueryColumns}}',
    'FROM _cdb_analysis_source JOIN _cdb_analysis_target',
    'ON ST_Intersects(_cdb_analysis_target.the_geom, _cdb_analysis_source.the_geom)'
].join('\n'));

function query(it) {
    it.sourceQueryColumns = it.columnNames.map(function(name) { return '_cdb_analysis_source.' + name; }).join(', ');
    return queryTemplate(it);
}
