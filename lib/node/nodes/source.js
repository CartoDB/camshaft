'use strict';

var Node = require('../node');

var TYPE = 'source';
var PARAMS = {
    query: Node.PARAM.STRING()
};

var Source = Node.create(TYPE, PARAMS, {
    beforeCreate: function(node) {
        // Last updated time in source node means data changed so it has to modify node.id
        node.setAttributeToModifyId('updatedAt');
        // Columns have to modify Node.id().
        // When a `select * from table` might end in a different set of columns we want to have a different node.
        // Current table triggers don't check DDL changes.
        node.setAttributeToModifyId('columns');
    }
});

module.exports = Source;

Source.prototype.sql = function() {
    return this.query;
};

/**
 * Source nodes are ready by definition
 *
 * @returns {Node.STATUS}
 */
Source.prototype.getStatus = function() {
    return Node.STATUS.READY; // TODO: this ignores the possibility of requirements exceeding the limits
};
