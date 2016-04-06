'use strict';

var dot = require('dot');
dot.templateSettings.strip = false;

var Node = require('../node');

var TYPE = 'moran';
var PARAMS = {
    source: Node.PARAM.NODE(Node.GEOMETRY.POLYGON),
    numerator_column: Node.PARAM.STRING,
    denominator_column: Node.PARAM.STRING,
    significance: Node.PARAM.NUMBER,
    neighbours: Node.PARAM.NUMBER,
    permutations: Node.PARAM.NUMBER,
    w_type: Node.PARAM.ENUM('knn', 'queen')
};
var OUTPUT = Node.GEOMETRY.POLYGON;

var Moran = Node.create(TYPE, PARAMS, OUTPUT, { cache: true });

module.exports = Moran;
module.exports.TYPE = TYPE;
module.exports.PARAMS = PARAMS;
module.exports.OUTPUT = OUTPUT;

Moran.prototype.sql = function() {
    return moranAnalysisQuery({
        _query: this.source.getQuery(),
        _numeratorColumn: this.numerator_column,
        _denominatorColumn: this.denominator_column,
        _significance: this.significance,
        _neighbours: this.neighbours,
        _permutations: this.permutations,
        _wType: this.w_type
    });
};

var moranAnalysisQuery = dot.template([
    'WITH',
    'input_query as (',
    '    {{=it._query}}',
    '),',
    'moran as (',
    '    SELECT * FROM',
    '    cdb_crankshaft.cdb_moran_local_rate(',
    '        \'{{=it._query}}\',',
    '        \'{{=it._numeratorColumn}}\',',
    '        \'{{=it._denominatorColumn}}\',',
    '        {{=it._significance}},',
    '        {{=it._neighbours}},',
    '        {{=it._permutations}},',
    '        \'the_geom\',',
    '        \'cartodb_id\',',
    '        \'{{=it._wType}}\'',
    '    )',
    ')',
    'select input_query.*, moran.* from input_query join moran',
    'on moran.ids = input_query.cartodb_id'
].join('\n'));
