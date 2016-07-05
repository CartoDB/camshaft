'use strict';

var Node = require('../node');

// var dot = require('dot');
// dot.templateSettings.strip = false;

var TYPE = 'aggregate-intersection';
var PARAMS = {
    source: Node.PARAM.NODE(Node.GEOMETRY.ANY),
    target: Node.PARAM.NODE(Node.GEOMETRY.ANY),
    aggregate_function: Node.PARAM.ENUM('avg', 'count', 'max', 'min', 'sum'),
    aggregate_column: Node.PARAM.NULLABLE(Node.PARAM.STRING())
};

var AggregateIntersection = Node.create(TYPE, PARAMS, { version: 1 });

module.exports = AggregateIntersection;
module.exports.TYPE = TYPE;
module.exports.PARAMS = PARAMS;

AggregateIntersection.prototype.sql = function() {
    var finalColumnName = this.aggregate_function;
    var qualifiedAggregateColumn = '_cdb_analysis_target.';
    if (this.aggregate_column === null) {
        qualifiedAggregateColumn += '*';
    } else {
        qualifiedAggregateColumn += this.aggregate_column;
        finalColumnName += '_' + this.aggregate_column;
    }

    var aggregateDensity = '';
    if (this.aggregate_function === 'count') {
        aggregateDensity = densityQueryTemplate({
            aggregateFunction: this.aggregate_function,
            qualifiedAggregateColumn: qualifiedAggregateColumn
        });
    }

    return queryAggregateTemplate({
        sourceQuery: this.source.getQuery(), // polygons
        targetQuery: this.target.getQuery(), // points
        sourceColumns: setAliasPrefixToColumnNames(this.source.getColumns(), '_cdb_analysis_source'),
        aggregateFunction: this.aggregate_function,
        qualifiedAggregateColumn: qualifiedAggregateColumn,
        aggregateFinalColumnName: finalColumnName,
        aggregateDensity: aggregateDensity
    });
};

function setAliasPrefixToColumnNames(columnNames, alias) {
    return columnNames.map(function (name) {
        return alias + '.' + name;
    }).join(', ');
}

var densityQueryTemplate = Node.template([
    ',',
    '{{=it.aggregateFunction}}({{=it.qualifiedAggregateColumn}})',
    '/',
    // use 2.6e-06 as minimum area (tile size at zoom level 31)
    'GREATEST(0.0000026, ST_Area((ST_Transform(_cdb_analysis_source.the_geom, 4326))::geography))',
    'as aggregate_density',
].join(' '));

var queryAggregateTemplate = Node.template([
    'SELECT',
    '  {{=it.sourceColumns}},',
    '  {{=it.aggregateFunction}}({{=it.qualifiedAggregateColumn}}) as {{=it.aggregateFinalColumnName}}',
    '  {{=it.aggregateDensity}}',
    'FROM ({{=it.sourceQuery}}) _cdb_analysis_source, ({{=it.targetQuery}}) _cdb_analysis_target',
    'WHERE ST_Intersects(_cdb_analysis_source.the_geom, _cdb_analysis_target.the_geom)',
    'GROUP BY',
    '  {{=it.sourceColumns}}'
].join('\n'));
