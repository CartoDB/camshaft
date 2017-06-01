'use strict';

var Node = require('../node');
var debug = require('../../util/debug')('analysis:data-observatory-measure');

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
    var sql = queryTemplate({
        columns: this.source.getColumns().join(', '),
        source: this.source.getQuery(false),
        final_column: this.final_column,
        segment_name: this.segment_name,
        percent: this.percent ? 'denominator' : undefined
    });

    debug(sql);

    return sql;
};

var queryTemplate = Node.template([
    'WITH _summary AS ( ',
    '  SELECT ST_SetSRID(ST_Extent(the_geom), 4326) extent, ',
    '         count(*)::INT numgeoms, ',
    '         ARRAY_AGG(DISTINCT ST_GeometryType(the_geom)) AS geom_types, ',
    '         ARRAY_AGG((the_geom, cartodb_id)::geomval) geomvals, ',
    '         SUM(ST_Area(the_geom)) sumarea ',
    '  FROM ({{=it.source}}) AS _camshaft_do_measure_analysis',
    '  ), ',
    '_meta AS ( ',
    '  SELECT cdb_dataservices_client._OBS_GetMeta_exception_safe( ',
    '            extent, ',
    '            (\'[{"numer_id": "{{=it.segment_name}}", ',
    '                 "target_area": \' || sumarea || \'}]\')::JSON ',
    '          , 1, 1, numgeoms) as meta FROM _summary ',
    '  ), ',
    '_data AS ( ',
    '  SELECT id AS __obs_id__, (data->0->>\'value\')::Numeric {{=it.final_column}} ',
    '  FROM cdb_dataservices_client._OBS_GetData_exception_safe( ',
    '    (SELECT geomvals FROM _summary), ',
    '    (SELECT jsonb_set(meta::jsonb, \'{0,normalization}\', ',
    '        CASE ',
    '          WHEN meta->0->>\'numer_aggregate\' = \'sum\' AND geom_types = \'{ST_Point}\' ',
    '            THEN \'"area"\'::jsonb ',
    '          ELSE \'"prenormalized"\'::jsonb ',
    '        END ',
    '    )::json FROM _meta, _summary) ',
    '  )) ',
    'SELECT {{=it.columns}}, _data.{{=it.final_column}} ',
    'FROM ({{=it.source}}) AS _camshaft_do_measure_analysis LEFT JOIN _data',
    'ON _camshaft_do_measure_analysis.cartodb_id = _data.__obs_id__ '
].join('\n'));
