'use strict';

var dot = require('dot');
dot.templateSettings.strip = false;

var Node = require('../node');

var TYPE = 'trade-area';
var PARAMS = {
    source: Node.PARAM.NODE,
    kind: Node.PARAM.ENUM('walk', 'car'),
    time: Node.PARAM.NUMBER,
    isolines: Node.PARAM.NUMBER
};

var TradeArea = Node.create(TYPE, PARAMS, { cache: true });

module.exports = TradeArea;
module.exports.TYPE = TYPE;
module.exports.PARAMS = PARAMS;

TradeArea.prototype.sql = function() {
    return query({
        pointsQuery: this.source.getQuery(),
        columnsQuery: this.source.getColumns(true).join(', '),
        kind: this.kind,
        isolines: buildRange(this.time, this.isolines).join(', ')
    });
};

function query(it) {
    return queryTemplate(it);
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
    ' {{=it.pointsQuery}}',
    ')',
    'SELECT',
    ' cdb_isochrone(',
    '  _cdb_analysis_source_points.the_geom,',
    '  \'{{=it.kind}}\'::text,',
    '  ARRAY[{{=it.isolines}}]::integer[]',
    ' ) the_geom,',
    ' {{=it.columnsQuery}}',
    'FROM _cdb_analysis_source_points',
].join('\n'));
