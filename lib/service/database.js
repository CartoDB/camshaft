'use strict';

var dot = require('dot');
dot.templateSettings.strip = false;

var debug = require('../util/debug')('database-service');

var QueryRunner = require('../postgresql/query-runner');
var QueryParser = require('../postgresql/query-parser');
var BatchClient = require('../postgresql/batch-client');

var QUERY_RUNNER_READONLY_OP = true;
var QUERY_RUNNER_WRITE_OP = !QUERY_RUNNER_READONLY_OP;

var createQueryTemplate = dot.template([
    'CREATE TABLE {{=it._targetTableName}} AS',
    '{{=it._query}}',
    'LIMIT 0'
].join('\n'));

function DatabaseService(username, apiKey, dbParams) {
    this.dbParams = dbParams;
    this.queryRunner = new QueryRunner(dbParams);
    this.queryParser = new QueryParser(this.queryRunner);
    this.batchClient = new BatchClient(username, apiKey);
}

module.exports = DatabaseService;

DatabaseService.prototype.run = function(query, callback) {
    this.queryRunner.run(query, QUERY_RUNNER_READONLY_OP, callback);
};

DatabaseService.prototype.createTable = function(targetTableName, query, callback) {
    var createQuery = createQueryTemplate({
        _targetTableName: targetTableName,
        _query: query
    });

    this.queryRunner.run(createQuery, QUERY_RUNNER_WRITE_OP, function(err, resultSet) {
        debug('TODO: register table');
        return callback(err, resultSet);
    });
};

DatabaseService.prototype.getSchema = function(query, callback) {
    this.queryParser.getSchema(query, callback);
};

DatabaseService.prototype.enqueue = function(query, callback) {
    this.batchClient.enqueue(query, callback);
};
