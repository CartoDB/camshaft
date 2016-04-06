'use strict';

var dot = require('dot');
dot.templateSettings.strip = false;

var Node = require('../node');

var TYPE = 'random-geometry';
var PARAMS = {
    geometry_type: Node.PARAM.ENUM('point', 'linestring', 'polygon')
};
var OUTPUT = function() {
    var geometries = {
        point: Node.GEOMETRY.POINT,
        linestring: Node.GEOMETRY.LINESTRING,
        polygon: Node.GEOMETRY.POLYGON
    };
    return geometries[this.geometry_type];
};

var RandomGeometry = Node.create(TYPE, PARAMS, OUTPUT);

module.exports = RandomGeometry;
module.exports.TYPE = TYPE;
module.exports.PARAMS = PARAMS;
module.exports.OUTPUT = OUTPUT;


RandomGeometry.prototype.sql = function() {
    var geometries = {
        point: 'POINT(0 0)',
        linestring: 'LINESTRING(0 0,1 1,1 2)',
        polygon: 'POLYGON((0 0,4 0,4 4,0 4,0 0),(1 1, 2 1, 2 2, 1 2,1 1))'
    };
    return 'SELECT ST_GeomFromEWKT(\'SRID=4326; ' + geometries[this.geometry_type] + '\')';
};