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

Source.prototype.sql = function() {
    return this.query;
};

Source.prototype.setColumns = function(columns) {
    this.columns = columns;
    // Makes columns affecting Node.id().
    // When a `select * from table` might end in a different set of columns
    // we want to have a different node.
    this.json.columns = columns;
};
