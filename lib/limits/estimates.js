// Functions for estimating the number of rows produced by nodes and other quantities

'use strict';

var dot = require('dot');

var estimatedCountTemplate = dot.template('EXPLAIN (FORMAT JSON) {{=it.sourceQuery}}');
var exactCountTemplate = dot.template([
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

// Estimated number of rows in the result of a node.
// A LimitsContext object must be provided.
// This is an asynchronous method; an error object and the number of estimated rows will
// be passed to the callback provided.
// This uses PostgreSQL query planner and statistics; it could fail, returning a null count
// if no stats are available or if a timeout occurs.
function estimatedNumberOfRows (node, context, callback) {
    var sql = estimatedCountTemplate({
        sourceQuery: node.sql()
    });
    context.runSQL(sql, function (err, resultSet) {
        var estimatedRows = null;
        if (!err) {
            if (resultSet.rows) {
                estimatedRows = resultSet.rows[0]['QUERY PLAN'][0].Plan['Plan Rows'];
            } else {
                // If we get no results (e.g. working with a fake db)
                // we make a most permissive estimate
                estimatedRows = 0;
            }
        }
        return callback(err, estimatedRows);
    });
}

// Number of rows in the result of the node.
// A LimitsContext object must be provided.
// This is an asynchronous method; an error object and the number of estimated rows will
// be passed to the callback provided.
// This can be slow for large tables or complex queries.
function numberOfRows (node, context, callback) {
    var sql = exactCountTemplate({
        sourceQuery: node.sql()
    });
    context.runSQL(sql, function (err, resultSet) {
        var countedRows = null;
        if (!err) {
            countedRows = resultSet.rows[0].result_rows;
        }
        return callback(err, countedRows);
    });
}

// Estimate number of distict values of a column in a node's query.
function numberOfDistinctValues (node, context, columnName, callback) {
    var sql = countDistinctValuesTemplate({
        source: node.sql(),
        column: columnName
    });
    context.runSQL(sql, function (err, resultSet) {
        var number = null;
        if (!err) {
            number = resultSet.rows[0].count_distict_values;
        }
        return callback(err, number);
    });
}

module.exports = {
    estimatedNumberOfRows: estimatedNumberOfRows,
    numberOfRows: numberOfRows,
    numberOfDistinctValues: numberOfDistinctValues
};
