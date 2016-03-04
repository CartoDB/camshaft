'use strict';

var Source = require('./source');

module.exports.create = function(definition, factory, databaseService, callback) {
    databaseService.getAffectedTables(definition.params.query, function(err, affectedTables) {
        if (err) {
            return callback(err);
        }

        databaseService.getColumnNames(definition.params.query, function(err, columnNames) {
            if (err) {
                return callback(err);
            }

            return callback(null, new Source(definition.params.query, affectedTables, columnNames, definition.params));
        });
    });
};
