'use strict';

var Node = require('../node');
var Source = require('./source');

var TYPE = 'tt-aggregate-intersection';
var PARAMS = {
    points_source: Node.PARAM.NODE(Node.GEOMETRY.POINT),
    polygons_target: Node.PARAM.NODE(Node.GEOMETRY.POLYGON),
    aggregate_function: Node.PARAM.ENUM('avg', 'count', 'max', 'min', 'sum'),
    aggregate_column: Node.PARAM.NULLABLE(Node.PARAM.STRING())
};

var TTAggregateIntersection = Node.create(TYPE, PARAMS, {
    cache: false,
    version: Date.now(),
    beforeCreate: function(node) {
        // if (node.source.getType() !== Source.TYPE || node.target.getType() !== Source.TYPE) {
        //     throw new Error('Params `source` and `target` should be Nodes with `type=source`');
        // }
        if (node.polygons_target.getAffectedTables().length !== 1) {
            throw new Error('Param `polygons_target` should have a known table');
        }
    }
});

module.exports = TTAggregateIntersection;

var TT_NAME_REGEX = /tt_(.*)$/i;
TTAggregateIntersection.prototype.getTTName = function() {
    var query = this.points_source.getQuery(false);
    var matches = query && query.match(TT_NAME_REGEX);
    return matches && matches[1];
};
// with meta as (select st_extent(the_geom_webmercator) as bbox from nyc_roads_25k)
// select array_to_json(ARRAY[st_xmin(bbox), st_ymin(bbox), st_xmax(bbox), st_ymax(bbox)]) from (select st_extent(the_geom_webmercator) as bbox from nyc_roads_25k) _meta

// with meta as (select t[1] AS table_name from CDB_QueryTablesText('select * from nyc_roads_25k') as t)
// select table_name from meta


// select * from TT_Intersection(
//     'nytdq',
//     'nyc_roads_25k',
//     (select array_to_json(ARRAY[st_xmin(bbox), st_ymin(bbox), st_xmax(bbox), st_ymax(bbox)]) from (select st_extent(the_geom_webmercator) as bbox from nyc_roads_25k) _meta),
//     ARRAY[]::json[],
//     ARRAY['{"type":"numeric","aggregate_function":"sum","aggregate_column":"fare_amount"}']::json[],
//     11
// ) AS intersection (
//     sum_fare_amount numeric,
//     cartodb_id int,
//     the_geom geometry,
//     the_geom_webmercator geometry,
//     z_order text,
//     oneway text,
//     bridge text,
//     tunnel text,
//     service text,
//     access text,
//     ref text,
//     type text,
//     class text,
//     name text
// )

var ttIntersectionTemplate = Node.template([
    'select * from TT_Intersection(',
    '    \'nytdq\',',
    '    \'taxi_zones\',',
    '    \'@bbox\'::json,',
    // '    (select array_to_json(ARRAY[st_xmin(bbox), st_ymin(bbox), st_xmax(bbox), st_ymax(bbox)]) from (select st_extent(the_geom_webmercator) as bbox from taxi_zones) _meta),',
    '    ARRAY[]::json[],',
    '    ARRAY[\'{"type":"numeric","aggregate_function":"sum","aggregate_column":"fare_amount"}\']::json[],',
    '    9',
    ') AS intersection (',
    '    sum_fare_amount numeric,',
    '    cartodb_id int,',
    '    the_geom geometry,',
    '    the_geom_webmercator geometry,',
    '    objectid text,',
    '    shape_leng text,',
    '    shape_area text,',
    '    zone text,',
    '    locationid text,',
    '    borough text',
    ')',
].join('\n'));

TTAggregateIntersection.prototype.sql = function() {
    return ttIntersectionTemplate({});

/*

SELECT nyc_roads_25k.cartodb_id, nyc_roads_25k.the_geom_webmercator, sum(tiledata.sum_fare_amount) as sum_fare_amount FROM TT_TileData(
    'yt2',
    '[-8218509.281222152,4950673.447974296,-8208725.341601647,4960457.387594799]'::json,
    ARRAY[]::json[],
    ARRAY['{"type":"numeric","aggregate_function":"count","aggregate_column":"1"}','{"type":"numeric","aggregate_function":"sum","aggregate_column":"fare_amount"}']::json[],
    13
) AS tiledata (
    cartodb_id int,
    the_geom_webmercator geometry,
    count_vals numeric,
    sum_fare_amount numeric
), nyc_roads_25k
WHERE ST_Intersects(nyc_roads_25k.the_geom_webmercator, tiledata.the_geom_webmercator)
group by nyc_roads_25k.cartodb_id, nyc_roads_25k.the_geom_webmercator

CREATE OR REPLACE FUNCTION TT_Intersection(
    tt_table TEXT,
    geom_table TEXT,
    bbox_json JSON,
    filters_json JSON[],
    aggregations_json JSON[],
    zoom_level INT
)

*/




    // var groupByColumns = setAliasPrefixToColumnNames(this.source.getColumns(), '_cdb_analysis_source');
    // var columns = setAliasPrefixToColumnNames(this.source.getColumns(), '_cdb_analysis_source');
    // var finalColumnName = this.aggregate_function;
    // var qualifiedAggregateColumn = '_cdb_analysis_target.';
    // if (this.aggregate_column === null) {
    //     qualifiedAggregateColumn += '*';
    // } else {
    //     qualifiedAggregateColumn += this.aggregate_column;
    //     finalColumnName += '_' + this.aggregate_column;
    // }

    // var aggregateFunctionColumn = aggregateFunctionTemplate({
    //     aggregateFunction: this.aggregate_function,
    //     qualifiedAggregateColumn: qualifiedAggregateColumn,
    //     aggregateFinalColumnName: this.aggregate_function === 'count' ? 'count_vals' : finalColumnName
    // });

    // columns.push(aggregateFunctionColumn);

    // return queryAggregateTemplate({
    //     sourceQuery: this.source.getQuery(), // polygons
    //     targetQuery: this.target.getQuery(), // points
    //     columns: columns.join(', '),
    //     groupByColumns: groupByColumns.join(', ')
    // });
};

function setAliasPrefixToColumnNames(columnNames, alias) {
    return columnNames.map(function (name) {
        return alias + '.' + name;
    });
}

var aggregateFunctionTemplate = Node.template(
    '{{=it.aggregateFunction}}({{=it.qualifiedAggregateColumn}}) as {{=it.aggregateFinalColumnName}}'
);

var queryAggregateTemplate = Node.template([
    'SELECT {{=it.columns}}',
    'FROM ({{=it.sourceQuery}}) _cdb_analysis_source, ({{=it.targetQuery}}) _cdb_analysis_target',
    'WHERE ST_Intersects(_cdb_analysis_source.the_geom, _cdb_analysis_target.the_geom)',
    'GROUP BY {{=it.groupByColumns}}'
].join('\n'));
