'use strict';

var Node = require('../node');
var limits = require('../limits');
var debug = require('../../util/debug')('analysis:line-sequential');

var TYPE = 'line-sequential';
var PARAMS = {
    source: Node.PARAM.NODE(Node.GEOMETRY.POINT),
    order_column:  Node.PARAM.STRING(),
    order_type: Node.PARAM.ENUM('asc', 'desc'),
    category_column: Node.PARAM.NULLABLE(Node.PARAM.STRING())
};

var LineSequential = Node.create(TYPE, PARAMS);

module.exports = LineSequential;

LineSequential.prototype.sql = function () {
    var sql = routingSequentialQueryTemplate({
        source: this.source.getQuery(),
        order_column:  this.order_column,
        order_type: this.order_type,
        category_column: this.category_column,
    });

    debug(sql);

    return sql;
};

var routingSequentialQueryTemplate = Node.template([
    'SELECT',
    '  row_number() over() AS cartodb_id,',
    '  *,',
    '  ST_Length(the_geom) as length',
    'FROM (',
    '  SELECT',
    '    {{? it.category_column }}{{=it.category_column}} as category,{{?}}',
    '    ST_MakeLine(the_geom ORDER BY {{=it.order_column}} {{=it.order_type}}) AS the_geom',
    '  FROM (',
    '    {{=it.source}}',
    '  ) _line_sequential',
    '  {{? it.category_column }}GROUP BY {{=it.category_column}}{{?}}',
    ') _cdb_analysis_line_sequential'
].join('\n'));

LineSequential.prototype.checkLimits = function(context, callback) {
    var self = this;
    var rowsLimit = context.getLimit(TYPE, 'maximumNumberOfRows', 1000000, 'too many input points');
    var pointsLimit = context.getLimit(TYPE, 'maximumNumberOfPointsPerLine', 100000, 'too many points per line');
    // The limits will be applied to the estimated number of input rows and
    // to the average number of groups per category_column (if present), which we take as a estimate of points per line
    limits.limitSingleInputRowsAndAvgGroupedRows(
        this,
        'source',
        self.category_column,
        context,
        { rowsLimit: rowsLimit, groupedRowsLimit: pointsLimit },
        callback
    );
};
