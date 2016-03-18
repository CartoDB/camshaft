'use strict';

var Node = require('../node');

var TYPE = 'source';
var PARAMS = {
    query: Node.PARAM.STRING
};

var Source = Node.create(TYPE, PARAMS);

module.exports = Source;
module.exports.TYPE = TYPE;
module.exports.PARAMS = PARAMS;
module.exports.create = require('./factory').create;

Source.prototype._getQuery = function() {
    return this.query;
};
