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

    getColumnNames: function(query, callback) {
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
