'use strict';

var Node = require('../node');

var TYPE = 'data-observatory-measure';
var PARAMS = {
    source: Node.PARAM.NODE(Node.GEOMETRY.POINT, Node.GEOMETRY.POLYGON),
    final_column: Node.PARAM.STRING(),
    segment_name: Node.PARAM.STRING(),
    percent: Node.PARAM.NULLABLE(Node.PARAM.BOOLEAN())
};

var DataObservatoryMeasure = Node.create(TYPE, PARAMS, { cache: true, lazy: true });

module.exports = DataObservatoryMeasure;

DataObservatoryMeasure.prototype.sql = function() {
    return queryTemplate({
        columns: this.source.getColumns().join(', '),
        source: this.source.getQuery(false),
        final_column: this.final_column,
        segment_name: this.segment_name,
        percent: this.percent ? 'denominator' : undefined
    });
};

var queryTemplate = Node.template([
    'WITH summary AS ( ',
    '  SELECT ST_SetSRID(ST_Extent(the_geom), 4326) extent, ',
    '         count(*)::INT numgeoms, ',
    '         ARRAY_AGG(DISTINCT ST_GeometryType(the_geom)) AS geom_types, ',
    '         ARRAY_AGG((the_geom, cartodb_id)::geomval) geomvals ',
    '  FROM {{=it.source}} ',
    '  ), ',
    'meta AS ( ',
    '  SELECT cdb_dataservices_client.OBS_GetMeta( ',
    '            extent, ',
    '            (\'[{"numer_id": "{{=it.segment_name}}"}]\')::JSON ',
    '          , null, null, numgeoms) as meta FROM summary ',
    '  ), ',
    'data AS ( ',
    '  SELECT id, (data->0->>\'value\')::Numeric {{=it.final_column}} ',
    '  FROM cdb_dataservices_client.OBS_GetData( ',
    '    (SELECT geomvals FROM summary), ',
    '    (SELECT jsonb_set(meta::jsonb, \'{0,normalization}\', ',
    '        CASE ',
    '          WHEN meta->0->>\'numer_aggregate\' = \'sum\' AND geom_types = \'{ST_Point}\' ',
    '            THEN \'"area"\'::jsonb ',
    '          ELSE \'"prenormalized"\'::jsonb ',
    '        END ',
    '    )::json FROM meta, summary) ',
    '  )) ',
    'SELECT {{=it.columns}}, data.{{=it.final_column}} ',
    'FROM data, {{=it.source}} source ',
    'WHERE source.cartodb_id = data.id '
].join('\n'));
