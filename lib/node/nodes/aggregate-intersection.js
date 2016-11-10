'use strict';

var Node = require('../node');

var TYPE = 'aggregate-intersection';
var PARAMS = {
    source: Node.PARAM.NODE(Node.GEOMETRY.ANY),
    target: Node.PARAM.NODE(Node.GEOMETRY.ANY),
    aggregate_function: Node.PARAM.ENUM('avg', 'count', 'max', 'min', 'sum'),
    aggregate_column: Node.PARAM.NULLABLE(Node.PARAM.STRING())
};

var AggregateIntersection = Node.create(TYPE, PARAMS, { cache: true, version: 3 });

module.exports = AggregateIntersection;

AggregateIntersection.prototype.sql = function() {
    var groupByColumns = setAliasPrefixToColumnNames(this.source.getColumns(), '_cdb_analysis_source');
    var columns = setAliasPrefixToColumnNames(this.source.getColumns(), '_cdb_analysis_source');
    var finalColumnName = this.aggregate_function;
    var qualifiedAggregateColumn = '_cdb_analysis_target.';
    if (this.aggregate_column === null) {
        qualifiedAggregateColumn += '*';
    } else {
        qualifiedAggregateColumn += this.aggregate_column;
        finalColumnName += '_' + this.aggregate_column;
    }

    var aggregateFunctionColumn = aggregateFunctionTemplate({
        aggregateFunction: this.aggregate_function,
        qualifiedAggregateColumn: qualifiedAggregateColumn,
        // TODO: we should adopt a common naming for new columns
        aggregateFinalColumnName: this.aggregate_function === 'count' ? 'count_vals' : finalColumnName
    });

    columns.push(aggregateFunctionColumn);

    if (this.aggregate_function === 'count') {
        var aggregateDensityColumn = densityQueryTemplate({
            aggregateFunction: this.aggregate_function,
            qualifiedAggregateColumn: qualifiedAggregateColumn,
            aggregateFinalColumnDensityName: 'count_vals_density'
        });

        columns.push(aggregateDensityColumn);
    }

    return queryAggregateTemplate({
        sourceQuery: this.source.getQuery(), // polygons
        targetQuery: this.target.getQuery(), // points
        columns: columns.join(', '),
        groupByColumns: groupByColumns.join(', ')
    });
};

function setAliasPrefixToColumnNames(columnNames, alias) {
    return columnNames.map(function (name) {
        return alias + '.' + name;
    });
}

var aggregateFunctionTemplate = Node.template(
    '{{=it.aggregateFunction}}({{=it.qualifiedAggregateColumn}}) as {{=it.aggregateFinalColumnName}}'
);

var densityQueryTemplate = Node.template([
    '{{=it.aggregateFunction}}({{=it.qualifiedAggregateColumn}})',
    '/',
    // use 2.6e-06 as minimum area (tile size at zoom level 31)
    'GREATEST(0.0000026, ST_Area((ST_Transform(_cdb_analysis_source.the_geom, 4326))::geography))',
    'as {{=it.aggregateFinalColumnDensityName}}',
].join(' '));

var queryAggregateTemplate = Node.template([
    'SELECT {{=it.columns}}',
    'FROM ({{=it.sourceQuery}}) _cdb_analysis_source, ({{=it.targetQuery}}) _cdb_analysis_target',
    'WHERE ST_Intersects(_cdb_analysis_source.the_geom, _cdb_analysis_target.the_geom)',
    'GROUP BY {{=it.groupByColumns}}'
].join('\n'));
