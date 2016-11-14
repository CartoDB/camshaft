// Node requirements estimation & checking

'use strict';

var async = require('async');

var dot = require('dot');

function NodeRequirements(node) {
    this.node = node;
}

var estimatedCountTemplate = dot.template('EXPLAIN (FORMAT JSON) {{=it.sourceQuery}}');
var exactCountTemplate = dot.template(
    [
        'SELECT count(*) AS result_rows',
        'FROM ({{=it.sourceQuery}}) _cdb_analysis_source'
    ].join('\n'));
var countDistinctValuesTemplate = dot.template([
    'SELECT COUNT(*) AS count_distict_values FROM (',
    '  SELECT DISTINCT {{=it.column}}',
    '  FROM (',
    '    {{=it.source}}',
    '  ) AS _cdb_analysis_query',
    ') AS _cdb_analysis_count_distinct'
].join('\n'));

function getNodeLimit(globalLimits, nodeType, limitName, defaultValue) {
    var limit = null;
    var limits = globalLimits.analyses;
    if (limits) {
        if (limits[nodeType] !== undefined) {
            limits = limits[nodeType];
        }
        limit = limits[limitName];
    }
    return limit || defaultValue;
}

// Estimated number of rows in the result of the node.
// A DatabaseService object (with a method run to execute SQL queries) must be provided.
// This is an asynchronous method; an error object and the number of estimated rows will
// be passed to the callback provided.
// This uses PostgreSQL query planner and statistics; it could fail, returning a null count
// if no stats are available or if a timeout occurs.
NodeRequirements.prototype.estimatedNumberOfRows = function(databaseService, callback) {
    var sql = estimatedCountTemplate({
        sourceQuery: this.node.sql()
    });
    databaseService.run(sql, function(err, resultSet){
        var estimated_rows = null;
        if (!err) {
            estimated_rows = resultSet.rows[0]['QUERY PLAN'][0].Plan['Plan Rows'];
        }
        return callback(err, estimated_rows);
    });
};

// Get estimated number of rows of all inputs; passes an object to the callback:
// { input_param: estimatedNumberOfRows, ... }
NodeRequirements.prototype.estimatedNumberOfInputRows = function(databaseService, callback) {
    // much easier with async 2.0!
    // async.mapValues(this.node.nodes, function(node, param, done) {
    //     var sql = estimatedCountTemplate({
    //         sourceQuery: node.sql()
    //     });
    //     databaseService.run(sql, function(err, resultSet){
    //         var estimated_rows = null;
    //         if (!err) {
    //             estimated_rows = resultSet.rows[0]['QUERY PLAN'][0].Plan['Plan Rows'];
    //         }
    //         return done(err, estimated_rows);
    //     });
    //
    // }, callback);
    var results = {};
    async.forEachOf(this.node.nodes, function(node, param, done) {
        var sql = estimatedCountTemplate({
            sourceQuery: node.sql()
        });
        databaseService.run(sql, function(err, resultSet){
            var estimated_rows = null;
            if (!err) {
                estimated_rows = resultSet.rows[0]['QUERY PLAN'][0].Plan['Plan Rows'];
            }
            results[param] = estimated_rows;
            return done(err);
        });

    }, function(err) {
        callback(err, results);
    });
};

// Number of rows in the result of the node.
// A DatabaseService object (with a method run to execute SQL queries) must be provided.
// This is an asynchronous method; an error object and the number of estimated rows will
// be passed to the callback provided.
// This can be slow for large tables or complex queries.
NodeRequirements.prototype.numberOfRows = function(databaseService, callback) {
    var sql = exactCountTemplate({
        sourceQuery: this.node.sql()
    });
    databaseService.run(sql, function(err, resultSet){
        var counted_rows = null;
        if (!err) {
            counted_rows = resultSet.rows[0].result_rows;
        }
        return callback(err, counted_rows);
    });
};

NodeRequirements.prototype.numberOfDistinctValues = function(databaseService, columnName, callback) {
    var sql = countDistinctValuesTemplate({
        source: this.node.sql(),
        column: columnName
    });
    databaseService.run(sql, function(err, resultSet){
        var number = null;
        if (!err) {
            number = resultSet.rows[0].count_distict_values;
        }
        return callback(err, number);
    });
};

NodeRequirements.prototype.limitNumberOfRows =
function(databaseService, defaultLimit, limits, callback) {
    var self = this;
    var limit = getNodeLimit(limits, self.node.getType(), 'maximumNumberOfRows', defaultLimit);
    if (!limit || !isFinite(limit)) {
        return callback(null);
    }
    self.estimatedNumberOfRows(databaseService, function(err, estimated_rows) {
        if (databaseService.checkForTimeout(err)) {
            return callback(err);
        }
        if (err) {
            // if estimation is not available don't abort the analysis
            err = null;
        } else {
            if (estimated_rows > limit) {
                err = self.errorForMessages(['too many result rows']);
            }
        }
        return callback(err);
    });
};

NodeRequirements.prototype.limitMaxInputRows = function(databaseService, limits, defaultLimit, callback) {
    var self = this;
    var limit = getNodeLimit(limits, this.node.getType(), 'maximumNumberOfRows', defaultLimit);
    if (!limit || !isFinite(limit)) {
        return callback(null);
    }
    this.estimatedNumberOfInputRows(databaseService, function(err, inputRows) {
        if (databaseService.checkForTimeout(err)) {
            return callback(err);
        } else {
            if (err) {
                return callback(null);
            } else {
                var maxRows = 0;
                err = null;
                Object.keys(inputRows).forEach(function(input) {
                    if (inputRows[input] > maxRows) {
                        maxRows = inputRows[input];
                    }
                });
                if (maxRows > limit) {
                    err = self.errorForMessages(['too many result rows']);
                }
                return callback(err);
            }
        }
    });
};

NodeRequirements.prototype.limitProductInputRows = function(databaseService, limits, defaultLimit, callback) {
    var self = this;
    var limit = getNodeLimit(limits, this.node.getType(), 'maximumNumberOfRows', defaultLimit);
    if (!limit || !isFinite(limit)) {
        return callback(null);
    }
    this.estimatedNumberOfInputRows(databaseService, function(err, inputRows) {
        if (databaseService.checkForTimeout(err)) {
            return callback(err);
        } else {
            if (err) {
                return callback(null);
            } else {
                var prodRows = 1;
                err = null;
                Object.keys(inputRows).forEach(function(input) {
                    prodRows *= inputRows[input];
                });
                if (prodRows > limit) {
                    err = self.errorForMessages(['too many result rows']);
                }
                return callback(err);
            }
        }
    });
};

NodeRequirements.prototype.limitSingleInputRows = function(param, databaseService, limits, defaultLimit, callback) {
    var self = this;
    var limit = getNodeLimit(limits, this.node.getType(), 'maximumNumberOfRows', defaultLimit);
    if (!limit || !isFinite(limit)) {
        return callback(null);
    }
    this.estimatedNumberOfInputRows(databaseService, function(err, inputRows) {
        if (databaseService.checkForTimeout(err)) {
            return callback(err);
        } else {
            if (err) {
                return callback(null);
            } else {
                var numRows = inputRows[param];
                if (numRows > limit) {
                    err = self.errorForMessages(['too many result rows']);
                }
                return callback(err);
            }
        }
    });
};

NodeRequirements.prototype.errorForMessages = function(messages) {
    var err = null;
    if (messages.length > 0) {
        err = new Error(messages.join('\n'));
        err.node_id = this.node.params ? this.node.params.id : undefined;
    }
    return err;
};

function getNodeLimit(globalLimits, nodeType, limitName, defaultValue) {
    var limit = null;
    var limits = globalLimits.analyses;
    if (limits) {
        if (limits[nodeType] !== undefined) {
            limits = limits[nodeType];
        }
        limit = limits[limitName];
    }
    return limit || defaultValue;
}

module.exports = NodeRequirements;
module.exports.getNodeLimit = getNodeLimit;
