'use strict';

var Node = require('../../node');
var queryBuilder = require('./point-in-polygon-query-builder');

var TYPE = 'point-in-polygon';
var PARAMS = {
    points_source: Node.PARAM.NODE,
    polygons_source: Node.PARAM.NODE
};

var PointInPolygon = Node.create(TYPE, PARAMS);

module.exports = PointInPolygon;
module.exports.TYPE = TYPE;
module.exports.PARAMS = PARAMS;

PointInPolygon.prototype.sql = function() {
    return queryBuilder({
        pointsQuery: this.points_source.getQuery(),
        polygonsQuery: this.polygons_source.getQuery(),
        columnNames: this.points_source.getColumns()
    });
};
