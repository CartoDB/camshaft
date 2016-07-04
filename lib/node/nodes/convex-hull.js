'use strict';

var Node = require('../node');

var TYPE = 'convex-hull';
var PARAMS = {
    source: Node.PARAM.NODE(Node.GEOMETRY.ANY),
    category_column : Node.PARAM.NULLABLE(Node.PARAM.STRING())
};

var ConvexHull = Node.create(TYPE, PARAMS);

module.exports = ConvexHull;
module.exports.TYPE = TYPE;
module.exports.PARAMS = PARAMS;

var convexHullTpl = Node.template([
    'SELECT',
    '  row_number() over() as cartodb_id,',
    '  {{? it._categoryColumn }}{{=it._categoryColumn}} as category,{{?}}',
    '  ST_ConvexHull(ST_Collect(the_geom)) AS the_geom',
    'FROM ({{=it._query}}) _analysis_source',
    '{{? it._categoryColumn }}GROUP BY {{=it._categoryColumn}}{{?}}'
].join('\n'));

ConvexHull.prototype.sql = function() {
    return convexHullTpl({
        _query: this.source.getQuery(),
        _categoryColumn: this.category_column
    });
};
