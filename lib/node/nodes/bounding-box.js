'use strict';

var Node = require('../node');

var TYPE = 'bounding-box';
var PARAMS = {
    source: Node.PARAM.NODE(Node.GEOMETRY.ANY),
    category_column: Node.PARAM.NULLABLE(Node.PARAM.STRING()),
    aggregation: Node.PARAM.NULLABLE(Node.PARAM.ENUM('avg', 'count', 'max', 'min', 'sum'), 'count'),
    aggregation_column: Node.PARAM.NULLABLE(Node.PARAM.STRING())
};

var BoundingBox = Node.create(TYPE, PARAMS, { version: 1,
    beforeCreate: function() {
        if (this.aggregation !== 'count' && this.aggregation_column === null) {
            throw new Error('Param `aggregation` != "count" requires an existent `aggregation_column` column');
        }
    }
});

module.exports = BoundingBox;

function finalColumnName(aggregation, aggregationColumn) {
    if (aggregation === 'count') {
        return 'count_vals';
    }

    return aggregation + '_' + aggregationColumn;
}

// See http://postgis.net/docs/ST_Envelope.html
var boundingBoxTpl = Node.template([
    'SELECT',
    '  row_number() over() as cartodb_id,',
    '  {{? it._categoryColumn }}{{=it._categoryColumn}} as category,{{?}}',
    '  ST_Envelope(ST_Collect(the_geom)) AS the_geom,',
    '  {{=it._aggregation}} as {{=it._finalColumnName}}',
    'FROM ({{=it._query}}) _analysis_source',
    '{{? it._categoryColumn }}GROUP BY {{=it._categoryColumn}}{{?}}'
].join('\n'));

var aggregationFnQueryTpl = Node.template('{{=it._aggregationFn}}({{=it._aggregationColumn}})');

BoundingBox.prototype.sql = function() {
    return boundingBoxTpl({
        _query: this.source.getQuery(),
        _categoryColumn: this.category_column,
        _aggregation: aggregationFnQueryTpl({
            _aggregationFn: this.aggregation,
            _aggregationColumn: this.aggregation_column || 1
        }),
        _finalColumnName: finalColumnName(this.aggregation, this.aggregation_column)
    });
};
