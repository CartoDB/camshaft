'use strict';

var fs = require('fs');
var dot = require('dot');
var pointInPolygon = fs.readFileSync(__dirname + '/point-in-polygon.sql');

dot.templateSettings.strip = false;

var pointInPolygonTemplate = dot.template(pointInPolygon);

module.exports = function buildQuery(it) {
    it.pointsColumns = it.columnNames.map(function(name) {
        return '_cdb_analysis_points.' + name;
    }).join(', ');

    return pointInPolygonTemplate(it);
};
