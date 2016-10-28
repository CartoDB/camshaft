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

var estimatedCountTemplate = Node.template('EXPLAIN (FORMAT JSON) {{=it.sourceQuery}}');

Source.prototype.computeRequirements = function(databaseService, limits, callback) {
    var sql = estimatedCountTemplate({
        sourceQuery: this.query
    });
    var self = this;
    databaseService.run(sql, function(err, resultSet){
        var limit = Node.getNodeLimit(limits, TYPE, 'maximumNumberOfRows', 1000000);
        var estimated = 0;
        if (databaseService.checkForTimeout(err)) {
            // if we timed out just explaining the query it is probably too comples
            limit = 0;
            estimated = 1;
            err = null;
        } else if (!err) {
            estimated = resultSet.rows[0]['QUERY PLAN'][0].Plan['Plan Rows'];
        }
        self.estimatedRequirements = {
            numberOfRows: estimated
        };
        self.limits = {
            maximumNumberOfRows: limit
        };
        return callback(err);
    });
};
