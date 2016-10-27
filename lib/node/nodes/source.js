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
    return Node.STATUS.READY;
};

var estimatedCountTemplate = Node.template('EXPLAIN (FORMAT JSON) {{=it.sourceQuery}}');

Source.prototype.computeRequirements = function(databaseService, limits, callback) {
    var sql = estimatedCountTemplate({
        sourceQuery: this.query
    });
    var self = this;
    databaseService.run(sql, function(err, resultSet){
      if (err) {
          return callback(err);
      }
      self.estimated_requirements = {
        result_rows: resultSet.rows[0]['QUERY PLAN'][0].Plan['Plan Rows']
      };
      self.limits = {
        result_rows: 1000000
      };
      return callback(null);
    });
};
