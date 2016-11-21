// Node requirements estimation & checking

'use strict';

var async = require('async');

var dot = require('dot');

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

// This function computes a limit value using these parameters:
// * globalLimits is an object holding the limits configuration
//   (limit values for each node type)
// * nodeType is the type of the node for which the limit will apply
// * limitName is the limit parameter name (as used in globalLimits)
// * defaultValue is the value used if the limit is not defined in globalLimits
function getLimit(globalLimits, nodeType, limitName, defaultValue) {
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
function estimatedNumberOfRows(node, databaseService, callback) {
    var sql = estimatedCountTemplate({
        sourceQuery: node.sql()
    });
    databaseService.run(sql, function(err, resultSet){
        var estimated_rows = null;
        if (!err) {
            estimated_rows = resultSet.rows[0]['QUERY PLAN'][0].Plan['Plan Rows'];
        }
        return callback(err, estimated_rows);
    });
}

// Get estimated number of rows of all inputs; passes an object to the callback:
// { input_param: estimatedNumberOfRows, ... }
function estimatedNumberOfInputRows(node, databaseService, callback) {
    // much easier with async 2.0!
    // async.mapValues(node.nodes, function(node, param, done) {
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
    async.forEachOf(node.nodes, function(node, param, done) {
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
}

// Number of rows in the result of the node.
// A DatabaseService object (with a method run to execute SQL queries) must be provided.
// This is an asynchronous method; an error object and the number of estimated rows will
// be passed to the callback provided.
// This can be slow for large tables or complex queries.
function numberOfRows(node, databaseService, callback) {
    var sql = exactCountTemplate({
        sourceQuery: node.sql()
    });
    databaseService.run(sql, function(err, resultSet){
        var counted_rows = null;
        if (!err) {
            counted_rows = resultSet.rows[0].result_rows;
        }
        return callback(err, counted_rows);
    });
}

function numberOfDistinctValues(node, databaseService, columnName, callback) {
    var sql = countDistinctValuesTemplate({
        source: node.sql(),
        column: columnName
    });
    databaseService.run(sql, function(err, resultSet){
        var number = null;
        if (!err) {
            number = resultSet.rows[0].count_distict_values;
        }
        return callback(err, number);
    });
}

function limitNumberOfRows(node, databaseService, limit, logger, callback) {
    if (!limit || !isFinite(limit)) {
        return callback(null);
    }
    estimatedNumberOfRows(node, databaseService, function(err, estimated_rows) {
        if (err) {
            // if estimation is not available don't abort the analysis
            if (logger) {
                logger.logLimitsError(err);
            }
            err = null;
        } else {
            if (estimated_rows > limit) {
                err = nodeError(node, ['too many result rows']);
            }
        }
        return callback(err);
    });
}

 function limitProductInputRows(node, databaseService, limit, logger, callback) {
    if (!limit || !isFinite(limit)) {
        return callback(null);
    }
    estimatedNumberOfInputRows(node, databaseService, function(err, inputRows) {
        if (err) {
            if (logger) {
                logger.logLimitsError(err);
            }
            err = null;
        } else {
            var prodRows = 1;
            err = null;
            Object.keys(inputRows).forEach(function(input) {
                prodRows *= inputRows[input];
            });
            if (prodRows > limit) {
                err = nodeError(node, ['too many result rows']);
            }
        }
        return callback(err);
    });
}

function limitSingleInputRows(node, param, databaseService, limit, logger, callback) {
    if (!limit || !isFinite(limit)) {
        return callback(null);
    }
    estimatedNumberOfInputRows(node, databaseService, function(err, inputRows) {
        if (err) {
            if (logger) {
                logger.logLimitsError(err);
            }
            err = null;
        } else {
            var numRows = inputRows[param];
            if (numRows > limit) {
                err = nodeError(node, ['too many result rows']);
            }
        }
        return callback(err);
    });
}

function nodeError(node, messages) {
    var err = null;
    if (messages.length > 0) {
        err = new Error(messages.join('\n'));
        err.node_id = node.params ? node.params.id : undefined;
    }
    return err;
}

module.exports = {
    estimatedNumberOfRows: estimatedNumberOfRows,
    estimatedNumberOfInputRows: estimatedNumberOfInputRows,
    numberOfRows: numberOfRows,
    numberOfDistinctValues: numberOfDistinctValues,
    limitNumberOfRows: limitNumberOfRows,
    limitProductInputRows: limitProductInputRows,
    limitSingleInputRows: limitSingleInputRows,
    getLimit: getLimit,
    nodeError: nodeError
};
