'use strict';

var Node = require('../node');

var fs = require('fs');
var dot = require('dot');

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
    var range = buildRange(this.time, this.isolines);
    var sourceQuery = this.source.getQuery();
    var columns = this.source.getColumns(true);

    var template = getTemplate(this.dissolved ? 'trade-area-dissolved' : 'trade-area');

    return template({
        pointsQuery: sourceQuery,
        columnsQuery: columns.join(', '),
        kind: this.kind,
        isolines: range.join(', ')
    });
};

function getTemplate(name) {
    var template = dot.template(fs.readFileSync(__dirname + '/sql/' + name +'.sql'));

    return function (it) {
        return template(it);
    };
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
