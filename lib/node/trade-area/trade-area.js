'use strict';

var Node = require('../node');

var TYPE = 'trade-area';
var PARAMS = {
    source: Node.PARAM.NODE,
    kind: Node.PARAM.ENUM('walk', 'drive', 'bike'),
    time: Node.PARAM.NUMBER
};

var TradeArea = Node.create(TYPE, PARAMS);

module.exports = TradeArea;
module.exports.TYPE = TYPE;
module.exports.PARAMS = PARAMS;
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
