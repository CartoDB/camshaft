'use strict';

var Node = require('../../node');
var buildQuery = require('./trade-area-query-builder');
var buildRange = require('./data-range-builder');

var TYPE = 'trade-area';
var PARAMS = {
    source: Node.PARAM.NODE,
    kind: Node.PARAM.ENUM('walk', 'car'),
    time: Node.PARAM.NUMBER,
    isolines: Node.PARAM.NUMBER,
    dissolved: Node.PARAM.BOOLEAN
};

var TradeArea = Node.create(TYPE, PARAMS, { cache: true });

module.exports = TradeArea;
module.exports.TYPE = TYPE;
module.exports.PARAMS = PARAMS;

TradeArea.prototype.sql = function() {
    var range = buildRange(this.time, this.isolines);
    var sourceQuery = this.source.getQuery();
    var columns = this.source.getColumns(true);

    console.log(buildQuery({
        pointsQuery: sourceQuery,
        columnsQuery: columns,
        kind: this.kind,
        isolines: range,
        dissolved: this.dissolved
    }));

    return buildQuery({
        pointsQuery: sourceQuery,
        columnsQuery: columns,
        kind: this.kind,
        isolines: range,
        dissolved: this.dissolved
    });
};
