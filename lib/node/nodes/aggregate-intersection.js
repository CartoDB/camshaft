'use strict';

var dot = require('dot');
dot.templateSettings.strip = false;

var Node = require('../node');

var TYPE = 'aggregate-intersection';
var PARAMS = {
    source: Node.PARAM.NODE(Node.GEOMETRY.ANY),
    target: Node.PARAM.NODE(Node.GEOMETRY.ANY),
    aggregate_function: Node.PARAM.ENUM('avg', 'count', 'max', 'min', 'sum'),
    aggregate_column: Node.PARAM.STRING
};

var AggregateIntersection = Node.create(TYPE, PARAMS);

module.exports = AggregateIntersection;
module.exports.TYPE = TYPE;
module.exports.PARAMS = PARAMS;

AggregateIntersection.prototype.sql = function() {
    return query({
        sourceQuery: this.source.getQuery(),
        targetQuery: this.target.getQuery(),
        columnNames: this.target.getColumns(),
        aggregate_function: this.aggregate_function,
        aggregate_column: this.aggregate_column
    });
};

function query(it) {
    it.targetColumns = setAliasPrefixToColumnNames(it.columnNames, '_cdb_analysis_target');
    it.prefixed_aggregate_column = '_cdb_analysis_source.' + it.aggregate_column;
    return queryAggregateTemplate(it);
}

function setAliasPrefixToColumnNames(columnNames) {
    return columnNames.map(function (name) {
        return '_cdb_analysis_target.' + name;
    }).join(', ');
}

var queryAggregateTemplate = dot.template([
    'WITH',
    '_cdb_analysis_source AS (',
    ' {{=it.sourceQuery}}',
    '),',
    '_cdb_analysis_target AS (',
    ' {{=it.targetQuery}}',
    ')',
    'SELECT',
    '  {{=it.targetColumns}},',
    '  {{=it.aggregate_function}}({{=it.prefixed_aggregate_column}})',
    '   as {{=it.aggregate_function}}_{{=it.aggregate_column}}',
    'FROM _cdb_analysis_source JOIN _cdb_analysis_target',
    '  ON ST_Intersects(_cdb_analysis_target.the_geom, _cdb_analysis_source.the_geom)',
    'GROUP BY',
    '  {{=it.targetColumns}}'
].join('\n'));
