'use strict';

var Node = require('../node');

var TYPE = 'data-observatory-multiple-measures';
var PARAMS = {
    source: Node.PARAM.NODE(Node.GEOMETRY.POINT, Node.GEOMETRY.POLYGON),
    numerators: Node.PARAM.ARRAY(Node.PARAM.STRING()),
    column_names: Node.PARAM.ARRAY(Node.PARAM.STRING())
};

var DataObservatoryMultipleMeasures = Node.create(TYPE, PARAMS, { cache: true, lazy: true,
    beforeCreate: function(node) {
        if (node.numerators.length !== node.column_names.length) {
            throw new Error('The number of numerators=' + node.numerators.length +
                ' does not match the number of column_names=' + node.column_names.length);
        }
        if (node.numerators.length === 0) {
            throw new Error('The numerators array cannot be empty');
        }
    }
});

module.exports = DataObservatoryMultipleMeasures;

DataObservatoryMultipleMeasures.prototype.sql = function() {
    var finalColumns = ['_camshaft_do_measure_analysis.*']
        .concat(this.column_names.map(function(columnName) {
            return '_data.' + columnName;
        })).join(', ');
    var sql = queryTemplate({
        source: this.source.getQuery(false),
        obsColumns: this.column_names.map(function(columnName) {
            return '(data->0->>\'value\')::Numeric AS ' + columnName;
        }).join(', '),
        obsMetaParams: this.numerators.map(function(numerator) {
            return '{"numer_id": "' + numerator + '", "target_area": \' || sumarea || \'}';
        }).join(','),
        finalColumns: finalColumns
    });
    console.log('------------------------------------------------------------');
    console.log(sql);

    return sql;
};

var queryTemplate = Node.template([
    'WITH _summary AS ( ',
    '    SELECT ST_SetSRID(ST_Extent(the_geom), 4326) extent, ',
    '         count(*)::INT numgeoms, ',
    '         ARRAY_AGG(DISTINCT ST_GeometryType(the_geom)) AS geom_types, ',
    '         ARRAY_AGG((the_geom, cartodb_id)::geomval) geomvals, ',
    '         SUM(ST_Area(the_geom)) sumarea ',
    '    FROM ({{=it.source}}) AS _camshaft_do_measure_analysis',
    '),',
    '_meta AS (',
    '    SELECT cdb_dataservices_client.OBS_GetMeta(',
    '        extent, (\'[{{=it.obsMetaParams}}]\')::JSON, 1, 1, numgeoms',
    '    ) as meta',
    '    FROM _summary',
    '), ',
    '_data AS ( ',
    '  SELECT id AS __obs_id__, {{=it.obsColumns}}',
    '  FROM cdb_dataservices_client.OBS_GetData( ',
    '    (SELECT geomvals FROM _summary), ',
    '    (SELECT jsonb_set(meta::jsonb, \'{0,normalization}\', ',
    '        CASE ',
    '          WHEN meta->0->>\'numer_aggregate\' = \'sum\' AND geom_types = \'{ST_Point}\' ',
    '            THEN \'"area"\'::jsonb ',
    '          ELSE \'"prenormalized"\'::jsonb ',
    '        END ',
    '    )::json FROM _meta, _summary) ',
    '  )) ',
    'SELECT {{=it.finalColumns}}',
    'FROM _data, ({{=it.source}}) AS _camshaft_do_measure_analysis ',
    'WHERE _camshaft_do_measure_analysis.cartodb_id = _data.__obs_id__ '
].join('\n'));
