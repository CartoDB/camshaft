'use strict';

var Node = require('../../node');
var buildQuery = require('./buffer-query-builder');

var TYPE = 'buffer';
var PARAMS = {
    source: Node.PARAM.NODE,
    radius: Node.PARAM.NUMBER
};

var Buffer = Node.create(TYPE, PARAMS);

module.exports = Buffer;
module.exports.TYPE = TYPE;
module.exports.PARAMS = PARAMS;

Buffer.prototype.sql = function() {
    return buildQuery({
        radius: this.radius,
        columns: this.source.getColumns(true),
        source: this.source.getQuery()
    });
};
