'use strict';

var dot = require('dot');
dot.templateSettings.strip = false;

var Node = require('../node');

var TYPE = 'trade-area';
var PARAMS = {
    source: Node.PARAM.NODE,
    kind: Node.PARAM.ENUM('walk', 'car'),
    time: Node.PARAM.NUMBER,
    isolines: Node.PARAM.NUMBER,
    dissolved: Node.PARAM.BOOLEAN
};

var TradeArea = Node.create(TYPE, PARAMS, { cache: true });

module.exports = TradeArea;
module.exports.TYPE = TYPE;
module.exports.PARAMS = PARAMS;

TradeArea.prototype.sql = function() {
    var sql;
    var range = buildRange(this.time, this.isolines).join(', ');
    var sourceQuery = this.source.getQuery();

    if (this.dissolved) {
        sql = queryDissolved({
            pointsQuery: sourceQuery,
            kind: this.kind,
            isolines: range
        });
    } else {
        sql = query({
            pointsQuery: sourceQuery,
            columnsQuery: this.source.getColumns(true).join(', '),
            kind: this.kind,
            isolines: buildRange(this.time, this.isolines).join(', '),
        });
    }

    return sql;
};

function query(it) {
    return queryTemplate(it);
}

function queryDissolved(it) {
    return queryDissolvedTemplate(it);
}

function buildRange(finalValue, stepsNumber) {
    var range = [];
    var stepSize = Math.ceil(finalValue / stepsNumber);
    var currentValue;

    for (var currentStep = 1; currentStep <= stepsNumber; currentStep++) {
        currentValue = currentStep * stepSize;

        if (currentValue > finalValue) {
            range.push(finalValue);
        } else {
            range.push(currentValue);
        }
    }

    return range;
}

var queryTemplate = dot.template([
    'WITH',
    '_cdb_analysis_source_points AS (',
    '  {{=it.pointsQuery}}',
    '),',
    '_cdb_analysis_isochrones AS (',
    '  SELECT',
    '    cdb_isochrone(',
    '      _cdb_analysis_source_points.the_geom,',
    '      \'{{=it.kind}}\'::text,',
    '      ARRAY[{{=it.isolines}}]::integer[]',
    '    ) as isochrone,',
    '    {{=it.columnsQuery}}',
    '  FROM _cdb_analysis_source_points',
    ')',
    'SELECT',
    '  (isochrone).center,',
    '  (isochrone).data_range,',
    '  (isochrone).the_geom,',
    '  {{=it.columnsQuery}}',
    'FROM _cdb_analysis_isochrones'
].join('\n'));

var queryDissolvedTemplate = dot.template([
    'WITH',
    '_cdb_analysis_source_points AS (',
    '  {{=it.pointsQuery}}',
    '),',
    '_cdb_analysis_isochrones AS (',
    '  SELECT',
    '    cdb_isochrone(',
    '      _cdb_analysis_source_points.the_geom,',
    '      \'{{=it.kind}}\'::text,',
    '      ARRAY[{{=it.isolines}}]::integer[]',
    '    ) as isochrone',
    '  FROM _cdb_analysis_source_points',
    '),',
    '_cdb_analysis_isochrones_spread AS (',
    '  SELECT',
    '    (isochrone).center,',
    '    (isochrone).data_range,',
    '    (isochrone).the_geom',
    '  FROM _cdb_analysis_isochrones',
    ')',
    'SELECT',
    '  data_range,',
    '  ST_Union(the_geom) the_geom',
    'FROM',
    '  _cdb_analysis_isochrones_spread',
    'GROUP BY data_range'
].join('\n'));
