'use strict';

var PointInPolygon = require('./point-in-polygon');
var async = require('async');

module.exports.create = function(definition, factory, databaseService, callback) {
    var sources = [definition.params.pointsSource, definition.params.polygonsSource];
    async.map(sources, factory.create.bind(factory), function(err, results) {
        if (err) {
            return callback(err);
        }

        var pointsNode = results[0];
        var polygonsNode = results[1];


        databaseService.getColumnNames(pointsNode.getQuery(), function(err, columnNames) {
            if (err) {
                return callback(err);
            }

            columnNames = columnNames
                .filter(function(columnName) {
                    return columnName !== 'the_geom_webmercator';
                });

            return callback(null, new PointInPolygon(pointsNode, polygonsNode, columnNames, definition.params));
        });

    });
};
