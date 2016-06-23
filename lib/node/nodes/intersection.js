'use strict';

var Node = require('../node');

var TYPE = 'intersection';
var PARAMS = {
    source: Node.PARAM.NODE(Node.GEOMETRY.ANY),
    target: Node.PARAM.NODE(Node.GEOMETRY.ANY)
};

var Intersection = Node.create(TYPE, PARAMS);

module.exports = Intersection;
module.exports.TYPE = TYPE;
module.exports.PARAMS = PARAMS;


Intersection.prototype.sql = function() {
    return queryTemplate({
        sourceQuery: this.source.getQuery(),
        targetQuery: this.target.getQuery()
    });
};

var queryTemplate = Node.template([
    'SELECT _cdb_analysis_source.*',
    'FROM ({{=it.sourceQuery}}) _cdb_analysis_source, ({{=it.targetQuery}}) _cdb_analysis_target',
    'WHERE ST_Intersects(_cdb_analysis_target.the_geom, _cdb_analysis_source.the_geom)'
].join('\n'));
