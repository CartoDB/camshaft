'use strict';

var Source = require('./source');

module.exports.create = function(definition, factory, databaseService, callback) {
    var source = new Source(definition.params);

    databaseService.getAffectedTables(source.getQuery(), function(err, affectedTables) {
        if (err) {
            return callback(err);
        }

        source.setAffectedTables(affectedTables);

        databaseService.getColumnNames(source.getQuery(), function(err, columnNames) {
            if (err) {
                return callback(err);
            }

            source.setColumns(columnNames);

            return callback(null, source);
        });
    });
};
