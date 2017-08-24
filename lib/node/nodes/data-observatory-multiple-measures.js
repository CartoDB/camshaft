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
    beforeCreate: function() {
        /* jshint maxcomplexity:8 */
        if (this.numerators.length === 0) {
            throw new Error('The numerators array cannot be empty');
        }

        if (this.numerators.length !== this.column_names.length) {
            throw new Error('The number of numerators=' + this.numerators.length +
                ' does not match the number of column_names=' + this.column_names.length);
        }

        if (this.normalizations.length === 0) {
            throw new Error('The normalizations array cannot be empty');
        }

        if (this.normalizations.length !== this.numerators.length) {
            throw new Error('The number of numerators=' + this.numerators.length +
                ' does not match the number of normalizations=' + this.normalizations.length);
        }

        if (this.denominators && this.denominators.length !== this.numerators.length) {
            throw new Error('The number of numerators=' + this.numerators.length +
                ' does not match the number of denominators=' + this.denominators.length);
        }

        if (this.geom_ids && this.geom_ids.length !== this.numerators.length) {
            throw new Error('The number of numerators=' + this.numerators.length +
                ' does not match the number of geom_ids=' + this.geom_ids.length);
        }

        if (this.numerator_timespans && this.numerator_timespans.length !== this.numerators.length) {
            throw new Error('The number of numerators=' + this.numerators.length +
                ' does not match the number of numerator_timespans=' + this.numerator_timespans.length);
        }

        this.columnTypes = this.numerators.reduce((columnTypes, numeratorId, index) => {
            columnTypes[numeratorId] = {
                name: this.column_names[index],
                type: 'Numeric'
            };
            return columnTypes;
        }, {});
    },
    beforeCreateAsync: function(databaseService, callback) {
        const sql = columnTypesQueryTemplate({
            source: this.source.getQuery(false),
            obsMetaParams: this._composeObsMetaParams()
        });
        databaseService.run(sql, (err, result) => {
            if (err) {
                return callback(err);
            }

            const measures = (Array.isArray(result.rows) && result.rows[0]) || {};
            measures.meta = measures.meta || [];
            measures.meta.forEach(measureMetadata => {
                if (this.columnTypes.hasOwnProperty(measureMetadata.numer_id)) {
                    const type = (measureMetadata.numer_type.toLowerCase() === 'text') ? 'Text' : 'Numeric';
                    this.columnTypes[measureMetadata.numer_id].type = type;
                }
            });

            return callback(null);
        });
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
        obsColumns: this.numerators.map((numeratorId, index) => {
            const type = this.columnTypes[numeratorId].type;
            const name = this.columnTypes[numeratorId].name;
            return `(data->${index}->>'value')::${type} AS ${name}`;
        }).join(', '),
        obsMetaParams: this._composeObsMetaParams(),
        finalColumns: finalColumns
    });

    debug(sql);

    return sql;
};

const metadataCTEemplate = `
    WITH _source AS (
        {{=it.source}}
    ),
    _summary AS (
        SELECT
            ST_SetSRID(ST_Extent(the_geom), 4326) extent,
            count(*)::INT numgeoms
        FROM _source
        WHERE the_geom IS NOT NULL
    ),
    _meta AS (
        SELECT
            cdb_dataservices_client._OBS_GetMeta_exception_safe(
                extent, ('{{=it.obsMetaParams}}')::JSON, 1, 1, numgeoms
            ) as meta
        FROM _summary
    )
`;

var queryTemplate = Node.template(`
    ${metadataCTEemplate},
    _data AS (
        SELECT id AS __obs_id__, {{=it.obsColumns}}
        FROM cdb_dataservices_client._OBS_GetData_exception_safe(
            (SELECT ARRAY_AGG((the_geom, cartodb_id)::geomval) FROM _source WHERE the_geom IS NOT NULL),
            (SELECT meta FROM _meta)
        ) AS _camshaft_do_measure_analysis_data
    )
    SELECT {{=it.finalColumns}}
    FROM _source left join _data
    ON _source.cartodb_id = _data.__obs_id__
`);


const columnTypesQueryTemplate = Node.template(`
    ${metadataCTEemplate}
    SELECT meta FROM _meta
`);


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
