'use strict';

var Node = require('../node');
var debug = require('../../util/debug')('analysis:data-observatory-multiple-measures');

var TYPE = 'data-observatory-multiple-measures';
var PARAMS = {
    source: Node.PARAM.NODE(Node.GEOMETRY.POINT, Node.GEOMETRY.POLYGON),
    numerators: Node.PARAM.ARRAY(Node.PARAM.STRING()),
    normalizations: Node.PARAM.ARRAY(Node.PARAM.STRING()),
    denominators: Node.PARAM.ARRAY(Node.PARAM.NULLABLE(Node.PARAM.STRING())),
    geom_ids: Node.PARAM.ARRAY(Node.PARAM.NULLABLE(Node.PARAM.STRING())),
    numerator_timespans: Node.PARAM.ARRAY(Node.PARAM.NULLABLE(Node.PARAM.STRING())),
    column_names: Node.PARAM.ARRAY(Node.PARAM.STRING())
};

var DataObservatoryMultipleMeasures = Node.create(TYPE, PARAMS, { cache: true, lazy: true,
    beforeCreate: function(node) {
        /* jshint maxcomplexity:8 */
        if (node.numerators.length === 0) {
            throw new Error('The numerators array cannot be empty');
        }

        if (node.numerators.length !== node.column_names.length) {
            throw new Error('The number of numerators=' + node.numerators.length +
                ' does not match the number of column_names=' + node.column_names.length);
        }

        if (node.normalizations.length === 0) {
            throw new Error('The normalizations array cannot be empty');
        }

        if (node.normalizations.length !== node.numerators.length) {
            throw new Error('The number of numerators=' + node.numerators.length +
                ' does not match the number of normalizations=' + node.normalizations.length);
        }

        if (node.denominators && node.denominators.length !== node.numerators.length) {
            throw new Error('The number of numerators=' + node.numerators.length +
                ' does not match the number of denominators=' + node.denominators.length);
        }

        if (node.geom_ids && node.geom_ids.length !== node.numerators.length) {
            throw new Error('The number of numerators=' + node.numerators.length +
                ' does not match the number of geom_ids=' + node.geom_ids.length);
        }

        if (node.numerator_timespans && node.numerator_timespans.length !== node.numerators.length) {
            throw new Error('The number of numerators=' + node.numerators.length +
                ' does not match the number of numerator_timespans=' + node.numerator_timespans.length);
        }
    }
});

module.exports = DataObservatoryMultipleMeasures;

DataObservatoryMultipleMeasures.prototype._composeObsMetaParams = function() {
    var params = this.numerators.map(function (numerator, index) {
        return {
            numer_id: numerator,
            denom_id: (this.denominators && this.denominators[index]) ?
                this.denominators[index] : null,
            normalization: this.normalizations[index],
            geom_id: (this.geom_ids && this.geom_ids[index]) ?
                this.geom_ids[index] : null,
            numer_timespan: (this.numerator_timespans && this.numerator_timespans[index]) ?
                this.numerator_timespans[index] : null
        };
    }.bind(this));

    return JSON.stringify(params);
};

DataObservatoryMultipleMeasures.prototype.sql = function() {
    var finalColumns = ['_source.*']
        .concat(this.column_names.map(function(columnName) {
            return '_data.' + columnName;
        })).join(', ');

    var sql = queryTemplate({
        source: this.source.getQuery(false),
        obsColumns: this.column_names.map(function (columnName, index) {
            return '(data->' + index + '->>\'value\')::Numeric AS ' + columnName;
        }).join(', '),
        obsMetaParams: this._composeObsMetaParams(),
        finalColumns: finalColumns
    });

    debug(sql);

    return sql;
};

var queryTemplate = Node.template([
    'WITH _source AS (',
    ' {{=it.source}}',
    '),',
    '_summary AS ( ',
    '  SELECT',
    '    ST_SetSRID(ST_Extent(the_geom), 4326) extent, ',
    '    count(*)::INT numgeoms',
    '  FROM _source',
    '  WHERE the_geom IS NOT NULL',
    '),',
    '_meta AS (',
    '  SELECT',
    '    cdb_dataservices_client._OBS_GetMeta_exception_safe(',
    '      extent,',
    '      (\'{{=it.obsMetaParams}}\')::JSON, 1, 1, numgeoms',
    '    ) as meta',
    '  FROM _summary',
    '),',
    '_data AS ( ',
    '  SELECT id AS __obs_id__, {{=it.obsColumns}}',
    '  FROM cdb_dataservices_client._OBS_GetData_exception_safe(',
    '    (SELECT ARRAY_AGG((the_geom, cartodb_id)::geomval) FROM _source WHERE the_geom IS NOT NULL),',
    '    (SELECT meta FROM _meta)',
    '  ) AS _camshaft_do_measure_analysis_data',
    ')',
    'SELECT {{=it.finalColumns}}',
    'FROM _source left join _data',
    'ON _source.cartodb_id = _data.__obs_id__'
].join('\n'));

var preCheckQueryTemplate = Node.template([
    'SELECT cdb_dataservices_client._OBS_PreCheck(\'{{=it.source}}\',',
    ' \'{{=it.obsMetaParams}}\'::json)'
].join(''));

DataObservatoryMultipleMeasures.prototype.preCheckQuery = function() {
    var sql = preCheckQueryTemplate({
        source: this.source.getQuery(false),
        obsMetaParams: this._composeObsMetaParams()
    });
    debug(sql);
    return sql;
};
