'use strict';

var Node = require('../node');

var TYPE = 'enrich';

var PARAMS = {
    source: Node.PARAM.NODE(Node.GEOMETRY.POINT),
    target: Node.PARAM.NODE(Node.GEOMETRY.ANY),
    column: Node.PARAM.STRING(),
    method: Node.PARAM.NULLABLE(Node.PARAM.NUMBER()),
    numberOfNeighbours: Node.PARAM.NULLABLE(Node.PARAM.NUMBER()),
    decayOrder: Node.PARAM.NULLABLE(Node.PARAM.NUMBER())
};

var Enrich = Node.create(TYPE, PARAMS, {cache: true, version: 1});

module.exports = Enrich;
module.exports.TYPE = TYPE;
module.exports.PARAMS = PARAMS;

var enrichTemplate = Node.template([
    'WITH ',
    '_source as (',
    ' SELECT array_agg(the_geom) as _geo,',
    ' array_agg({{=it.column}}) as _values',
    ' FROM ({{=it.sourceQuery}}) _s',
    '),',
    '_target as (',
    ' SELECT',
    ' *,',
    ' CASE WHEN GeometryType(_t.the_geom) = \'POINT\' THEN _t.the_geom',
    ' ELSE ST_Centroid(_t.the_geom) END as _geo',
    ' FROM ({{=it.targetQuery}}) _t',
    ')',
    'SELECT',
    ' _target.*,',
    ' CDB_SpatialInterpolation(',
    '_source._geo,',
    ' _source._values,',
    ' _target._geo,',
    ' {{=it.method}} ,',
    ' {{=it.p1}} ,',
    ' {{=it.p2}} )',
    ' as {{=it.column}}',
    ' FROM _target, _source'
].join('\n'));


Enrich.prototype.sql = function(){
    return enrichTemplate({
        sourceQuery: this.source.getQuery(),
        targetQuery: this.target.getQuery(),
        method: this.method === null ? 1 : this.method, // 0: nearest neighbor, 1: barymetric, 2: IDW
        p1: this.numberOfNeighbours === null ? 0 : this.numberOfNeighbours, // IDW, number of neighbors, 0 -> unlimited
        p2: this.decayOrder === null ? 0 : this.decayOrder  // IDW: decay order, 0 -> order 1
    });
};
