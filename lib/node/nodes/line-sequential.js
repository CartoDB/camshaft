'use strict';

var Node = require('../node');
var Checks = require('../../limits/checks');
var debug = require('../../util/debug')('analysis:line-sequential');

var TYPE = 'line-sequential';
var PARAMS = {
    source: Node.PARAM.NODE(Node.GEOMETRY.POINT),
    order_column:  Node.PARAM.STRING(),
    order_type: Node.PARAM.ENUM('asc', 'desc'),
    category_column: Node.PARAM.NULLABLE(Node.PARAM.STRING())
};

var LIMITS = {
    rowsLimit: {
        default: 1000000,
        message: 'too many input points',
        name: 'maximumNumberOfRows'
    },
    groupedRowsLimit: {
        default: 100000,
        message: 'too many points per line',
        name: 'maximumNumberOfPointsPerLine'
    }
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

Buffer.prototype.checkLimits = function(context, callback) {
    Checks.check(this, context, [{
        checker: Checks.limitInputRowsAndAvgGroupedRows,
        params: { input: 'source', column: this.category_column },
        limits: LIMITS
    }], callback);
};
