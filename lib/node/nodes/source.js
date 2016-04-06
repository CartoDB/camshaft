'use strict';

var Node = require('../node');

var TYPE = 'source';
var PARAMS = {
    query: Node.PARAM.STRING
};
var OUTPUT = Node.GEOMETRY.ANY;

var Source = Node.create(TYPE, PARAMS, OUTPUT);

module.exports = Source;
module.exports.TYPE = TYPE;
module.exports.PARAMS = PARAMS;
module.exports.OUTPUT = OUTPUT;

Source.prototype.sql = function() {
    return this.query;
};
