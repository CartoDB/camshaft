'use strict';

var Node = require('../node');

var TYPE = 'contour';

var PARAMS = {
    // the scattered points dataset with real values
    source: Node.PARAM.NODE(Node.GEOMETRY.POINT),
    // column of values in source dataset
    column: Node.PARAM.STRING(),
    // buffer around my dataset
    buffer: Node.PARAM.NULLABLE(Node.PARAM.NUMBER(), 0.2),
    // 0: nearest neighbor, 1: barymetric, 2: IDW
    method: Node.PARAM.NULLABLE(Node.PARAM.ENUM('nearest_neighbor', 'barymetric', 'IDW'), 'barymetric'),
    // classification method
    class_method: Node.PARAM.NULLABLE(Node.PARAM.ENUM('equals', 'headstails', 'jenks', 'quantiles'), 'quantiles'),
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
    'a AS({{=it.source_query}}),',
    'b AS(',
    '    SELECT',
    '    array_agg(the_geom) as g,',
    '    array_agg({{=it.column}}::numeric) as v',
    '    FROM a',
    '    WHERE {{=it.column}} is not null   ',
    ')',
    'SELECT',
    '    contour.bin as cartodb_id,',
    '    contour.*',
    'FROM',
    '    b,',
    '    cdb_crankshaft.CDB_contour(b.g, b.v,',
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
        method: ['nearest_neighbor', 'barymetric','IDW'].indexOf(this.method),
        class: ['equals', 'headstails', 'jenks', 'quantiles'].indexOf(this.class_method),
        steps: this.steps,
        resolution: this.resolution,
    });
};
