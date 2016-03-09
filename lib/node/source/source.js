'use strict';

var Node = require('../node');

var TYPE = 'source';

var Source = Node.create(TYPE, {
    query: Node.PARAM_TYPE.TEXT
});

module.exports = Source;
module.exports.TYPE = TYPE;
module.exports.create = require('./factory').create;

Source.prototype.getQuery = function() {
    return this.query;
};
