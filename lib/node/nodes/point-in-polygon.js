'use strict';

var Node = require('../node');

var TYPE = 'point-in-polygon';
var PARAMS = {
    points_source: Node.PARAM.NODE(Node.GEOMETRY.POINT),
    polygons_source: Node.PARAM.NODE(Node.GEOMETRY.POLYGON)
};

var PointInPolygon = Node.create(TYPE, PARAMS);

module.exports = PointInPolygon;


PointInPolygon.prototype.sql = function() {
    return queryTemplate({
        pointsQuery: this.points_source.getQuery(),
        polygonsQuery: this.polygons_source.getQuery()
    });
};

var queryTemplate = Node.template([
    'SELECT _cdb_analysis_points.*',
    'FROM ({{=it.pointsQuery}}) _cdb_analysis_points, ({{=it.polygonsQuery}}) _cdb_analysis_polygons',
    'WHERE ST_Contains(_cdb_analysis_polygons.the_geom, _cdb_analysis_points.the_geom)'
].join('\n'));
