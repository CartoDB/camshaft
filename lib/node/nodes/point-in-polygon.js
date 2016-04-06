'use strict';

var dot = require('dot');
dot.templateSettings.strip = false;

var Node = require('../node');

var TYPE = 'point-in-polygon';
var PARAMS = {
    points_source: Node.PARAM.NODE(Node.GEOMETRY.POINT),
    polygons_source: Node.PARAM.NODE(Node.GEOMETRY.POLYGON)
};
var OUTPUT = Node.GEOMETRY.POINT;

var PointInPolygon = Node.create(TYPE, PARAMS, OUTPUT);

module.exports = PointInPolygon;
module.exports.TYPE = TYPE;
module.exports.PARAMS = PARAMS;
module.exports.OUTPUT = OUTPUT;


PointInPolygon.prototype.sql = function() {
    return query({
        pointsQuery: this.points_source.getQuery(),
        polygonsQuery: this.polygons_source.getQuery(),
        columnNames: this.points_source.getColumns()
    });
};

var queryTemplate = dot.template([
    'WITH',
    '_cdb_analysis_points AS (',
    ' {{=it.pointsQuery}}',
    '),',
    '_cdb_analysis_polygons AS (',
    ' {{=it.polygonsQuery}}',
    ')',
    'SELECT {{=it.pointsColumns}}',
    'FROM _cdb_analysis_points JOIN _cdb_analysis_polygons',
    'ON ST_Contains(_cdb_analysis_polygons.the_geom, _cdb_analysis_points.the_geom)'
].join('\n'));

function query(it) {
    it.pointsColumns = it.columnNames.map(function(name) { return '_cdb_analysis_points.' + name; }).join(', ');
    return queryTemplate(it);
}
