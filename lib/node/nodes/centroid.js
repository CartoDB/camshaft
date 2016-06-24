'use strict';

var Node = require('../node');

var TYPE = 'centroid';

var PARAMS = {
    source : Node.PARAM.NODE(Node.GEOMETRY.ANY),
    category_column : Node.PARAM.NULLABLE(Node.PARAM.STRING()),
    aggregation: Node.PARAM.NULLABLE(Node.PARAM.STRING(), 'count'),
    aggregation_column: Node.PARAM.NULLABLE(Node.PARAM.STRING())
};

var Centroid = Node.create(TYPE, PARAMS);

module.exports = Centroid;
module.exports.TYPE = TYPE;
module.exports.PARAMS = PARAMS;

var centroidTemplate = Node.template([
    'SELECT',
    '  row_number() over() as cartodb_id,',
    '  ST_Centroid(ST_Collect(the_geom)) as the_geom,',
    '  {{? it.categoryColumn }}{{=it.categoryColumn}} as category,{{?}}',
    '  {{=it.aggregation}} as value',
    'FROM ({{=it.query}}) q',
    '{{? it.categoryColumn }}GROUP BY {{=it.categoryColumn}}{{?}}'
].join('\n'));

var aggregationFnQueryTpl = Node.template('{{=it._aggregationFn}}({{=it._aggregationColumn}})');

Centroid.prototype.sql = function(){
    return centroidTemplate({
        query: this.source.getQuery(),
        categoryColumn: this.category_column,
        aggregation: aggregationFnQueryTpl({
            _aggregationFn: this.aggregation,
            _aggregationColumn: this.aggregation_column || 1
        })
    });
};
