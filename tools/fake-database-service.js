'use strict';

function FakeDatabaseService() {

}

module.exports = FakeDatabaseService;

FakeDatabaseService.prototype = {
    run: function(query, callback) {
        return callback(null, {});
    },

    createTable: function(targetTableName, query, callback) {
        return callback(null, {});
    },

    createTableIfNotExists: function(targetTableName, outputQuery, callback) {
        return callback(null, true);
    },

    setUpdatedAtForSources: function(analysis, callback) {
        return callback(null);
    },

    registerAnalysisInCatalog: function(analysis, callback) {
        return callback(null);
    },

    queueAnalysisOperations: function(analysis, callback) {
        return callback(null);
    },

    trackAnalysis: function(analysis, callback) {
        return callback(null);
    },

    getColumnNames: function(query, callback) {
        return callback(null, []);
    },

    getColumns: function(query, callback) {
        return callback(null, []);
    },

    enqueue: function(query, callback) {
        return callback(null, {status: 'ok'});
    },

    registerNodesInCatalog: function(nodes, callback) {
        return callback(null);
    },

    trackNode: function(node, callback) {
        return callback(null);
    }
};
