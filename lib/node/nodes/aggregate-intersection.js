'use strict';

var Node = require('../node');

var TYPE = 'aggregate-intersection';
var PARAMS = {
    source: Node.PARAM.NODE(Node.GEOMETRY.ANY),
    target: Node.PARAM.NODE(Node.GEOMETRY.ANY),
    aggregate_function: Node.PARAM.ENUM('avg', 'count', 'max', 'min', 'sum'),
    aggregate_column: Node.PARAM.STRING()
};

var AggregateIntersection = Node.create(TYPE, PARAMS, { version: 1 });

module.exports = AggregateIntersection;
module.exports.TYPE = TYPE;
module.exports.PARAMS = PARAMS;

AggregateIntersection.prototype.sql = function() {
    return query({
        sourceQuery: this.source.getQuery(), // polygons
        targetQuery: this.target.getQuery(), // points
        columnNames: this.source.getColumns(),
        aggregate_function: this.aggregate_function,
        aggregate_column: this.aggregate_column
    });
};

function query(it) {
    it.sourceColumns = setAliasPrefixToColumnNames(it.columnNames, '_cdb_analysis_source');
    it.prefixed_aggregate_column = '_cdb_analysis_target.' + it.aggregate_column;
    return queryAggregateTemplate(it);
}

function setAliasPrefixToColumnNames(columnNames, alias) {
    return columnNames.map(function (name) {
        return alias + '.' + name;
    }).join(', ');
}

var queryAggregateTemplate = Node.template([
    'SELECT',
    '  {{=it.sourceColumns}},',
    '  {{=it.aggregate_function}}({{=it.prefixed_aggregate_column}})',
    '   as {{=it.aggregate_function}}_{{=it.aggregate_column}}',
    'FROM ({{=it.sourceQuery}}) _cdb_analysis_source, ({{=it.targetQuery}}) _cdb_analysis_target',
    'WHERE ST_Intersects(_cdb_analysis_source.the_geom, _cdb_analysis_target.the_geom)',
    'GROUP BY',
    '  {{=it.sourceColumns}}'
].join('\n'));
