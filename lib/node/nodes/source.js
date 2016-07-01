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
    }
});

module.exports = Source;
module.exports.TYPE = TYPE;
module.exports.PARAMS = PARAMS;

Source.prototype.sql = function() {
    return this.query;
};

Source.prototype.setColumnsNames = function(columns) {
    this.columns = columns;
    // Makes columns affecting Node.id().
    // When a `select * from table` might end in a different set of columns
    // we want to have a different node.
    this.setAttributeToModifyId('columns');
};

/**
 * Source nodes are ready by definition
 *
 * @returns {Node.STATUS}
 */
Source.prototype.getStatus = function() {
    return Node.STATUS.READY;
};

Source.prototype.getAndSetUpdatedAt = function(databaseService, callback) {
    if (this.updatedAt !== null) {
        return callback(null, this.updatedAt);
    }
    databaseService.getLastUpdatedTimeFromAffectedTables(this.sql(), function(err, lastUpdatedAt) {
        if (err) {
            return callback(err);
        }
        this.updatedAt = lastUpdatedAt;

        return callback(null, this.updatedAt);
    }.bind(this));
};
