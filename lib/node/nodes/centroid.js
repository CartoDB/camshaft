'use strict';

var Node = require('../node');
var debug = require('../../util/debug')('analysis:centroid');

var TYPE = 'centroid';

var PARAMS = {
    source : Node.PARAM.NODE(Node.GEOMETRY.ANY),
    category_column : Node.PARAM.NULLABLE(Node.PARAM.STRING()),
    aggregation: Node.PARAM.NULLABLE(Node.PARAM.ENUM('avg', 'count', 'max', 'min', 'sum'), 'count'),
    aggregation_column: Node.PARAM.NULLABLE(Node.PARAM.STRING()),
};

var Centroid = Node.create(TYPE, PARAMS, { version: 1,
    beforeCreate: function(node) {
        if (node.aggregation !== 'count' && node.aggregation_column === null) {
            throw new Error('Param `aggregation` != "count" requires an existent `aggregation_column` column');
        }
    }
});

module.exports = Centroid;
module.exports.TYPE = TYPE;
module.exports.PARAMS = PARAMS;

var centroidTemplate = Node.template([
    'SELECT',
    '  row_number() over() as cartodb_id,',
    '  {{=it.columns}}',
    'FROM ({{=it.query}}) q',
    '{{? it.categoryColumn }} GROUP BY {{=it.categoryColumn}}{{?}}'
].join('\n'));

var centroidColumnTemplate = Node.template([
    'ST_Centroid({{? it.categoryColumn }}ST_Collect(the_geom){{??}}the_geom{{?}}) as the_geom'
]);

var categoryColumnTemplate = Node.template([
    '{{=it.categoryColumn}} as category'
]);

var aggregationColumnTemplate = Node.template([
    '{{=it.aggregation}}({{=it.aggregationColumn}}) as value',
]);

Centroid.prototype.sql = function() {
    var columns = [
        centroidColumnTemplate({
            categoryColumn: this.category_column
        })
    ];

    if (this.category_column) {
        columns.push(categoryColumnTemplate({
            categoryColumn: this.category_column
        }));
    }

    if (this.aggregation && this.category_column) {
        columns.push(aggregationColumnTemplate({
            aggregation: this.aggregation,
            aggregationColumn: this.aggregation_column || 1
        }));
    }

    var sql = centroidTemplate({
        query: this.source.getQuery(),
        columns: columns.join(', '),
        categoryColumn: this.category_column
    });

    debug(sql);

    return sql;
};
