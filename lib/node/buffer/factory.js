'use strict';

var Buffer = require('./buffer');

module.exports.create = function(definition, factory, databaseService, callback) {
    factory.create(definition.params.source, function(err, node) {
        if (err) {
            return callback(err);
        }

        var bufferNode = new Buffer(definition.params, {source: node});

        databaseService.getColumnNames(node.getQuery(), function(err, columnNames) {
            if (err) {
                return callback(err);
            }

            bufferNode.setColumns(columnNames);

            return callback(null, bufferNode);
        });
    });
};
