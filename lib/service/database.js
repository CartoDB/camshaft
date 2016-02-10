'use strict';

var QueryRunner = require('../postgresql/query-runner');
var QueryParser = require('../postgresql/query-parser');
var BatchClient = require('../postgresql/batch-client');

function DatabaseService(username, apiKey, dbParams) {
    this.dbParams = dbParams;
    this.queryRunner = new QueryRunner(dbParams);
    this.queryParser = new QueryParser(this.queryRunner);
    this.batchClient = new BatchClient(username, apiKey);
}

module.exports = DatabaseService;

DatabaseService.prototype.run = function(query, callback) {
    this.queryRunner.run(query, callback);
};

DatabaseService.prototype.getSchema = function(query, callback) {
    this.queryParser.getSchema(query, callback);
};

DatabaseService.prototype.enqueue = function(query, callback) {
    this.batchClient.enqueue(query, callback);
};
