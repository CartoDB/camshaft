'use strict';

var Buffer = require('./buffer');

module.exports.create = function(definition, factory, databaseService, callback) {
    factory.create(definition.params.source, function(err, node) {
        if (err) {
            return callback(err);
        }

        databaseService.getColumnNames(node.getQuery(), function(err, columnNames) {
            if (err) {
                return callback(err);
            }

            return callback(null, new Buffer(node, definition.params.radio, columnNames, definition.params));
        });
    });
};
