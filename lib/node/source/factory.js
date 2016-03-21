'use strict';

var Source = require('./source');

module.exports.create = function(definition, factory, databaseService, callback) {
    var source = new Source(definition.params);

    databaseService.getAffectedTables(source.getQuery(), function(err, affectedTables) {
        // ignore error as we might be hitting it for a high level node

        source.setAffectedTables(affectedTables || []);

        databaseService.getColumnNames(source.getQuery(), function(err, columnNames) {
            if (err) {
                return callback(err);
            }

            source.setColumns(columnNames);

            return callback(null, source);
        });
    });
};
