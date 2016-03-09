'use strict';

var Node = require('../node');

var TYPE = 'trade-area';

var TradeArea = Node.create(TYPE, {
    source: Node.PARAM_TYPE.NODE,
    kind: Node.PARAM_TYPE.TEXT,
    time: Node.PARAM_TYPE.NUMERIC
});

module.exports = TradeArea;
module.exports.TYPE = TYPE;
module.exports.create = require('./factory').create;

// ------------------------------ PUBLIC API ------------------------------ //

TradeArea.prototype.getQuery = function() {
    return 'select * from ' + this.getTargetTable();
};

TradeArea.prototype.getCacheTables = function() {
    return [this.getTargetTable()];
};

// ---------------------------- END PUBLIC API ---------------------------- //

TradeArea.prototype.getTargetTable = function() {
    return 'analysis_trade_area_' + this.id();
};
