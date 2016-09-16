'use strict';

var Node = require('../node');

var TYPE = 'contour';

var METHODS = ['nearest_neighbor', 'barymetric','IDW'];

var CLASS_METHODS = ['equals', 'headstails', 'jenks', 'quantiles'];

var PARAMS = {
    // the scattered points dataset with real values
    source: Node.PARAM.NODE(Node.GEOMETRY.POINT),
    // column of values in source dataset
    column: Node.PARAM.STRING(),
    // buffer around my dataset
    buffer: Node.PARAM.NULLABLE(Node.PARAM.NUMBER(), 0.2),
    // 0: nearest neighbor, 1: barymetric, 2: IDW
    method: Node.PARAM.NULLABLE(Node.PARAM.ENUM(METHODS), METHODS[1]),
    // classification method
    class_method: Node.PARAM.NULLABLE(Node.PARAM.ENUM(CLASS_METHODS), CLASS_METHODS[3]),
    // number of classes
    steps: Node.PARAM.NULLABLE(Node.PARAM.NUMBER(), 7),
    // if <=0: max acceptable processing time inseconds, if >0 resolution in meters
    resolution: Node.PARAM.NULLABLE(Node.PARAM.NUMBER(), -90)
};

var Contour = Node.create(TYPE, PARAMS, {
    cache: true,
    version: 1
});

module.exports = Contour;
module.exports.TYPE = TYPE;
module.exports.PARAMS = PARAMS;

var contourTemplate = Node.template([
    'WITH',
    'source AS({{=it.source_query}}),',
    'aggregates AS(',
    '    SELECT',
    '    array_agg(the_geom) as geoms,',
    '    array_agg({{=it.column}}::numeric) as values',
    '    FROM source',
    '    WHERE {{=it.column}} is not null   ',
    ')',
    'SELECT',
    '    contour.bin as cartodb_id,',
    '    contour.*',
    'FROM',
    '    aggregates,',
    '    cdb_crankshaft.CDB_contour(aggregates.geoms, aggregates.values,',
    '        {{=it.buffer}},',
    '        {{=it.method}},',
    '        {{=it.class}},',
    '        {{=it.steps}},',
    '        {{=it.resolution}}) contour'
].join('\n'));

Contour.prototype.sql = function () {
    return contourTemplate({
        source_query: this.source.getQuery(),
        column: this.column,
        buffer: this.buffer,
        method: METHODS.indexOf(this.method),
        class: CLASS_METHODS.indexOf(this.class_method),
        steps: this.steps,
        resolution: this.resolution,
    });
};
