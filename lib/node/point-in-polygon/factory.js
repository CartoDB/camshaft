'use strict';

var PointInPolygon = require('./point-in-polygon');
var async = require('async');

module.exports.create = function(definition, factory, databaseService, callback) {
    var sources = [definition.params.points_source, definition.params.polygons_source];
    async.map(sources, factory.create.bind(factory), function(err, results) {
        if (err) {
            return callback(err);
        }

        var pointsNode = results[0];
        var polygonsNode = results[1];

        var pointInPolygon = new PointInPolygon(definition.params, {
            points_source: pointsNode, polygons_source: polygonsNode
        });

        databaseService.getColumnNames(pointsNode.getQuery(), function(err, columnNames) {
            if (err) {
                return callback(err);
            }

            columnNames = columnNames
                .filter(function(columnName) {
                    return columnName !== 'the_geom_webmercator';
                });

            pointInPolygon.setColumns(columnNames);

            return callback(null, pointInPolygon);
        });

    });
};
