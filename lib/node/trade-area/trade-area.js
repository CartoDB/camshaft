'use strict';

var id = require('../../util/id');

var TYPE = 'trade-area';

function TradeArea(inputNode, kind, time, params) {
    this.inputNode = inputNode;
    this.kind = kind; // walk, drive, bike
    this.time = time; // in seconds

    this.columns = [];

    this.params = params || {};
}

module.exports = TradeArea;
module.exports.TYPE = TYPE;
module.exports.create = require('./factory').create;

// ------------------------------ PUBLIC API ------------------------------ //

TradeArea.prototype.id = function() {
    return id(this.toJSON());
};

TradeArea.prototype.getQuery = function() {
    return 'select * from ' + this.getTargetTable();
};

TradeArea.prototype.getColumns = function() {
    return this.columns;
};

TradeArea.prototype.setColumns = function(columns) {
    this.columns = columns;
};

TradeArea.prototype.getInputNodes = function() {
    return [this.inputNode];
};

TradeArea.prototype.getCacheTables = function() {
    return [this.getTargetTable()];
};

TradeArea.prototype.getAffectedTables = function() {
    return [];
};

TradeArea.prototype.toJSON = function() {
    return {
        type: TYPE,
        inputNodeId: this.inputNode.id(),
        kind: this.kind,
        time: this.time
    };
};

TradeArea.prototype.toDot = function() {
    return {
        type: TYPE,
        color: 'red',
        nodes: {
            inputNode: this.inputNode
        },
        attrs: {
            kind: this.kind,
            time: this.time
        }
    };
};

// ---------------------------- END PUBLIC API ---------------------------- //

TradeArea.prototype.getTargetTable = function() {
    return 'analysis_trade_area_' + this.id();
};
