'use strict';

var Node = require('../node');

var tradeAreasQueryTemplate = Node.getSqlTemplateFn('trade-area');
var tradeAreasDissolvedQueryTemplate = Node.getSqlTemplateFn('trade-area-dissolved');

var TYPE = 'trade-area';
var PARAMS = {
    source: Node.PARAM.NODE(Node.GEOMETRY.POINT),
    kind: Node.PARAM.ENUM('walk', 'car'),
    time: Node.PARAM.NUMBER(),
    isolines: Node.PARAM.NUMBER(),
    dissolved: Node.PARAM.BOOLEAN()
};

var TradeArea = Node.create(TYPE, PARAMS, { cache: true, version: 3, tags: ['io4x'] });

module.exports = TradeArea;

TradeArea.prototype.sql = function() {
    var template = this.dissolved ? tradeAreasDissolvedQueryTemplate : tradeAreasQueryTemplate;

    return template({
        pointsQuery: this.source.getQuery(),
        columnsQuery: this.source.getColumns(true).filter(columnName => columnName !== 'cartodb_id').join(', '),
        kind: this.kind,
        isolines: buildRange(this.time, this.isolines).join(', ')
    });
};

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
