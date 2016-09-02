'use strict';

var Node = require('../node');

var TYPE = 'enrich';

var PARAMS = {
    // the scattered points dataset with real values
    source: Node.PARAM.NODE(Node.GEOMETRY.POINT),
    // the geometries dataset that we want to enrich with interpolated values
    target: Node.PARAM.NODE(Node.GEOMETRY.ANY),
    // column of values in source dataset
    column: Node.PARAM.STRING(),
    // 0: nearest neighbor, 1: barymetric, 2: IDW
    method: Node.PARAM.NULLABLE(Node.PARAM.ENUM('nearest_neighbor', 'barymetric','IDW'),'barymetric'),
    // IDW, number of neighbors, 0 -> unlimited
    number_of_neighbours: Node.PARAM.NULLABLE(Node.PARAM.NUMBER(),0),
    // IDW: decay order, 0 -> order 1
    decay_order: Node.PARAM.NULLABLE(Node.PARAM.NUMBER(),0)
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
    ' {{=it.number_of_neighbours}} ,',
    ' {{=it.decay_order}} )',
    ' as {{=it.column}}',
    ' FROM _target, _source'
].join('\n'));


Enrich.prototype.sql = function(){
    return enrichTemplate({
        sourceQuery: this.source.getQuery(),
        targetQuery: this.target.getQuery(),
        method: ['nearest_neighbor', 'barymetric','IDW'].indexOf[this.method],
        number_of_neighbours: this.number_of_neighbours,
        decay_order: this.decay_order
    });
};
