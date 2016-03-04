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
    this.pointsNode = pointsNode;
    this.polygonsNode = polygonsNode;

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
        pointsQuery: this.pointsNode.getQuery(),
        polygonsQuery: this.polygonsNode.getQuery(),
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
    return [this.pointsNode, this.polygonsNode];
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
        pointsNodeId: this.pointsNode.id(),
        polygonsNodeNodeId: this.polygonsNode.id()
    };
};

PointInPolygon.prototype.toDot = function() {
    return {
        type: TYPE,
        color: 'red',
        nodes: {
            pointsNode: this.pointsNode,
            polygonsNodeNode: this.polygonsNode
        },
        attrs: {}
    };
};
