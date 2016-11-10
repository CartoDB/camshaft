// Node requirements estimation & checking

'use strict';

var dot = require('dot');

function NodeRequirements(node) {
    this.node = node;
    this.estimatedRequirements = {};
    this.limits = {};
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

NodeRequirements.prototype.getEstimatedRequirement = function(name) {
    return this.estimatedRequirements[name];
};

NodeRequirements.prototype.getLimit = function(name) {
    return this.limits[name];
};

NodeRequirements.prototype.setEstimatedRequirement = function(name, value) {
    this.estimatedRequirements[name] = value;
};

NodeRequirements.prototype.setLimit = function(name, value) {
    this.limits[name] = value;
};

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

NodeRequirements.prototype.setEstimatedNumberOfRowsFromQuery =
function(databaseService, default_limit, limits, callback) {
    var self = this;
    self.estimatedNumberOfRows(databaseService, function(err, estimated_rows) {
        var limit = getNodeLimit(limits, self.node.getType(), 'maximumNumberOfRows', default_limit);
        if (databaseService.checkForTimeout(err)) {
            // if we timed out just explaining the query it is probably too complex
            limit = 0;
            estimated_rows = 1;
            err = null;
        }
        self.setEstimatedRequirement('numberOfRows', estimated_rows);
        self.setLimit('maximumNumberOfRows', limit);
        return callback(err);
    });
};

NodeRequirements.prototype.setNumberOfRowsFromQuery = function(databaseService, limits, default_limit, callback) {
    var self = this;
    self.numberOfRows(databaseService, function(err, rows_count) {
        var limit = getNodeLimit(limits, self.node.getType(), 'maximumNumberOfRows', default_limit);
        if (databaseService.checkForTimeout(err)) {
            // if we timed out just explaining the query it is probably too complex
            limit = 0;
            rows_count = 1;
            err = null;
        }
        self.setEstimatedRequirement('numberOfRows', rows_count);
        self.setLimit('maximumNumberOfRows', limit);
        return callback(err);
    });
};

NodeRequirements.prototype.setMaxInputNumberOfRows = function(limits, default_limit) {
    // Compute maximum of the inputs' number of rows.
    var maxRows = Math.max.apply(
        null,
        this.node.inputNodes.map(function(node) {
            return node.requirements.getEstimatedRequirement('numberOfRows') || 0;
        })
    );
    var limit = getNodeLimit(limits, this.node.getType(), 'maximumNumberOfRows', default_limit);
    if (maxRows < 0) {
        maxRows = 0;
    }
    this.setEstimatedRequirement('numberOfRows', maxRows);
    this.setLimit('maximumNumberOfRows', limit);
};

NodeRequirements.prototype.setProductInputNumberOfRows = function(limits, default_limit) {
    // Compute product of the inputs' number of rows.
    var prodRows = 1;
    var limit = getNodeLimit(limits, this.node.getType(), 'maximumNumberOfRows', default_limit);
    this.node.inputNodes.forEach(function(input_node) {
        prodRows *= input_node.requirements.getEstimatedRequirement('numberOfRows') || 0;
    });
    this.setEstimatedRequirement('numberOfRows', prodRows);
    this.setLimit('maximumNumberOfRows', limit);
};

NodeRequirements.prototype.setSingleInputNumberOfRows = function(input, limits, default_limit) {
    // Compute product of the inputs' number of rows.
    var rows = this.node[input].requirements.getEstimatedRequirement('numberOfRows') || 0;
    var limit = getNodeLimit(limits, this.node.getType(), 'maximumNumberOfRows', default_limit);
    this.setEstimatedRequirement('numberOfRows', rows);
    this.setLimit('maximumNumberOfRows', limit);
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
