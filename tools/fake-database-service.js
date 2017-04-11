'use strict';

function FakeDatabaseService() {

}

module.exports = FakeDatabaseService;

FakeDatabaseService.prototype = {
    run: function(query, callback) {
        return callback(null, {});
    },

    createCacheTable: function(node, callback) {
        return callback(null, true);
    },

    registerAnalysisInCatalog: function(analysis, callback) {
        return callback(null);
    },

    getMetadataFromAffectedTables: function(node, skip, callback) {
        return callback(null, 0);
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
    }
};
