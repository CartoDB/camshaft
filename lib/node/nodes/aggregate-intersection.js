'use strict';

var dot = require('dot');
dot.templateSettings.strip = false;

var Node = require('../node');

var TYPE = 'aggregate-intersection';
var PARAMS = {
    source_a: Node.PARAM.NODE,
    source_b: Node.PARAM.NODE,
    aggregate_function: Node.PARAM.ENUM('avg', 'count', 'max', 'min', 'sum'),
    aggregate_column: Node.PARAM.STRING
};

var AggregateIntersection = Node.create(TYPE, PARAMS);

module.exports = AggregateIntersection;
module.exports.TYPE = TYPE;
module.exports.PARAMS = PARAMS;

AggregateIntersection.prototype.sql = function() {
    return query({
        sourceAQuery: this.source_a.getQuery(),
        sourceBQuery: this.source_b.getQuery(),
        columnNames: this.source_b.getColumns(),
        aggregate_function: this.aggregate_function,
        aggregate_column: this.aggregate_column
    });
};

function query(it) {
    it.sourceBColumns = setAliasPrefixToColumnNames(it.columnNames, '_cdb_analysis_source_b');
    it.prefixed_aggregate_column = '_cdb_analysis_source_a.' + it.aggregate_column;
    return queryAggregateTemplate(it);
}

function setAliasPrefixToColumnNames(columnNames) {
    return columnNames.map(function (name) {
        return '_cdb_analysis_source_b.' + name;
    }).join(', ');
}

var queryAggregateTemplate = dot.template([
    'WITH',
    '_cdb_analysis_source_a AS (',
    ' {{=it.sourceAQuery}}',
    '),',
    '_cdb_analysis_source_b AS (',
    ' {{=it.sourceBQuery}}',
    ')',
    'SELECT',
    '  {{=it.sourceBColumns}},',
    '  {{=it.aggregate_function}}({{=it.prefixed_aggregate_column}})',
    '   as {{=it.aggregate_function}}_{{=it.aggregate_column}}',
    'FROM _cdb_analysis_source_a JOIN _cdb_analysis_source_b',
    '  ON ST_Intersects(_cdb_analysis_source_b.the_geom, _cdb_analysis_source_a.the_geom)',
    'GROUP BY',
    '  {{=it.sourceBColumns}}'
].join('\n'));
