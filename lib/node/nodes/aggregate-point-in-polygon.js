'use strict';

var dot = require('dot');
dot.templateSettings.strip = false;

var Node = require('../node');

var TYPE = 'aggregate-point-in-polygon';
var PARAMS = {
    points_source: Node.PARAM.NODE,
    polygons_source: Node.PARAM.NODE,
    aggregate_function: Node.PARAM.ENUM('avg', 'count', 'max', 'min', 'sum'),
    aggregate_column: Node.PARAM.STRING
};

var AggregatePointInPolygon = Node.create(TYPE, PARAMS);

module.exports = AggregatePointInPolygon;
module.exports.TYPE = TYPE;
module.exports.PARAMS = PARAMS;

AggregatePointInPolygon.prototype.sql = function() {
    return query({
        pointsQuery: this.points_source.getQuery(),
        polygonsQuery: this.polygons_source.getQuery(),
        columnNames: this.polygons_source.getColumns(),
        aggregate_function: this.aggregate_function,
        aggregate_column: this.aggregate_column
    });
};

function query(it) {
    it.polygonsColumns = setAliasPrefixToColumnNames(it.columnNames, '_cdb_analysis_polygons');
    it.prefixed_aggregate_column = '_cdb_analysis_points.' + it.aggregate_column;
    return queryAggregateTemplate(it);
}

function setAliasPrefixToColumnNames(columnNames) {
    return columnNames.map(function (name) {
        return '_cdb_analysis_polygons.' + name;
    }).join(', ');
}

var queryAggregateTemplate = dot.template([
    'WITH',
    '_cdb_analysis_points AS (',
    ' {{=it.pointsQuery}}',
    '),',
    '_cdb_analysis_polygons AS (',
    ' {{=it.polygonsQuery}}',
    ')',
    'SELECT',
    '  {{=it.polygonsColumns}},',
    '  {{=it.aggregate_function}}({{=it.prefixed_aggregate_column}})',
    '   as {{=it.aggregate_function}}_{{=it.aggregate_column}}',
    'FROM _cdb_analysis_points JOIN _cdb_analysis_polygons',
    '  ON ST_Contains(_cdb_analysis_polygons.the_geom, _cdb_analysis_points.the_geom)',
    'GROUP BY',
    '  {{=it.polygonsColumns}}'
].join('\n'));
