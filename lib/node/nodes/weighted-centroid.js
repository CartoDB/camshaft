'use strict';

var Node = require('../node');

var TYPE = 'weighted-centroid';

var PARAMS = {
    source : Node.PARAM.NODE(Node.GEOMETRY.POINT),
    weight_column : Node.PARAM.STRING(),
    category_column : Node.PARAM.STRING(),
    aggregation: Node.PARAM.NULLABLE(Node.PARAM.STRING(), 'count'),
    aggregation_column: Node.PARAM.NULLABLE(Node.PARAM.STRING())
};

var WeightedCentroid = Node.create(TYPE, PARAMS, {cache: true, version: 2});

module.exports = WeightedCentroid;
module.exports.TYPE = TYPE;
module.exports.PARAMS = PARAMS;

var weightedCentroidTemplate = Node.template([
    'SELECT',
    '  row_number() over() as cartodb_id,',
    '  cdb_crankshaft.CDB_WeightedMean(the_geom, {{=it.weight_column}}::NUMERIC) as the_geom,',
    '  {{=it.category_column}} as category,',
    '  {{=it.aggregation}} as value',
    'FROM ({{=it.query}}) q',
    'GROUP BY {{=it.category_column}}'
].join('\n'));

var aggregationFnQueryTpl = Node.template('{{=it._aggregationFn}}({{=it._aggregationColumn}})');

WeightedCentroid.prototype.sql = function(){
    return weightedCentroidTemplate({
        query: this.source.getQuery(),
        weight_column: this.weight_column,
        category_column: this.category_column,
        aggregation: aggregationFnQueryTpl({
            _aggregationFn: this.aggregation,
            _aggregationColumn: this.aggregation_column || 1
        })
    });
};
