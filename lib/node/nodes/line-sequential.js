'use strict';

var Node = require('../node');
var debug = require('../../util/debug')('analysis:line-sequential');

var TYPE = 'line-sequential';
var PARAMS = {
    source: Node.PARAM.NODE(Node.GEOMETRY.POINT),
    order_column:  Node.PARAM.NULLABLE(Node.PARAM.STRING(), 'cartodb_id'),
    order_type: Node.PARAM.NULLABLE(Node.PARAM.ENUM('asc', 'desc'), 'asc')
};

var LineSequential = Node.create(TYPE, PARAMS);

module.exports = LineSequential;
module.exports.TYPE = TYPE;
module.exports.PARAMS = PARAMS;

LineSequential.prototype.sql = function () {
    var sql = routingSequentialQueryTemplate({
        source: this.source.getQuery(),
        order_column:  this.order_column,
        order_type: this.order_type
    });

    debug(sql);

    return sql;
};

var routingSequentialQueryTemplate = Node.template([
    'SELECT',
    '  ST_MakeLine(the_geom ORDER BY {{=it.order_column}} {{=it.order_type}}) AS the_geom',
    'FROM (',
    '  {{=it.source}}',
    ') _cdb_analysis_line'
].join('\n'));
