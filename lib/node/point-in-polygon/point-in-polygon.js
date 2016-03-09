'use strict';

var dot = require('dot');
dot.templateSettings.strip = false;

var id = require('../../util/id');

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

var TYPE = 'point-in-polygon';

function PointInPolygon(pointsNode, polygonsNode, columns, params) {
    this.points_source = pointsNode;
    this.polygons_source = polygonsNode;

    this.columns = columns;

    this.params = params || {};
}

module.exports = PointInPolygon;
module.exports.TYPE = TYPE;
module.exports.create = require('./factory').create;


PointInPolygon.prototype.id = function() {
    return id(this.toJSON());
};

PointInPolygon.prototype.getQuery = function() {
    return query({
        pointsQuery: this.points_source.getQuery(),
        polygonsQuery: this.polygons_source.getQuery(),
        columnNames: this.columns
    });
};

PointInPolygon.prototype.getColumns = function() {
    return this.columns;
};

PointInPolygon.prototype.setColumns = function(columns) {
    this.columns = columns;
};

PointInPolygon.prototype.getInputNodes = function() {
    return [this.points_source, this.polygons_source];
};

PointInPolygon.prototype.getCacheTables = function() {
    return [];
};

PointInPolygon.prototype.getAffectedTables = function() {
    return [];
};

PointInPolygon.prototype.toJSON = function() {
    return {
        type: TYPE,
        pointsNodeId: this.points_source.id(),
        polygonsNodeNodeId: this.polygons_source.id()
    };
};

PointInPolygon.prototype.toDot = function() {
    return {
        type: TYPE,
        color: 'red',
        nodes: {
            pointsNode: this.points_source,
            polygonsNodeNode: this.polygons_source
        },
        attrs: {}
    };
};
