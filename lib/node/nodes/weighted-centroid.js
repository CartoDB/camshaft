'use strict';

var Node = require('../node');

var TYPE = 'weighted-centroid';

var PARAMS = {
    source: Node.PARAM.NODE(Node.GEOMETRY.ANY),
    weight_column: Node.PARAM.STRING(),
    category_column: Node.PARAM.NULLABLE(Node.PARAM.STRING()),
    aggregation: Node.PARAM.NULLABLE(Node.PARAM.STRING(), 'count'),
    aggregation_column: Node.PARAM.NULLABLE(Node.PARAM.STRING())
};

var WeightedCentroid = Node.create(TYPE, PARAMS, { cache: true, version: 3 });

module.exports = WeightedCentroid;

var weightedCentroidTemplate = Node.template([
    'SELECT',
    '  row_number() over() as cartodb_id,',
    '  cdb_crankshaft.CDB_WeightedMean(ST_Centroid(the_geom), {{=it.weightColumn}}::NUMERIC) as the_geom,',
    '  {{? it.categoryColumn }}{{=it.categoryColumn}} as category,{{?}}',
    '  {{=it.aggregation}} as value',
    'FROM ({{=it.query}}) q',
    '{{? it.categoryColumn }}GROUP BY {{=it.categoryColumn}}{{?}}'
].join('\n'));

var aggregationFnQueryTpl = Node.template('{{=it._aggregationFn}}({{=it._aggregationColumn}})');

WeightedCentroid.prototype.sql = function () {
    return weightedCentroidTemplate({
        query: this.source.getQuery(),
        weightColumn: this.weight_column,
        categoryColumn: this.category_column,
        aggregation: aggregationFnQueryTpl({
            _aggregationFn: this.aggregation,
            _aggregationColumn: this.aggregation_column || 1
        })
    });
};
