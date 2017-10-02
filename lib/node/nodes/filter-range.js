'use strict';

var Node = require('../node');
var Range = require('../../filter/range');

var TYPE = 'filter-range';
var PARAMS = {
    source: Node.PARAM.NODE(Node.GEOMETRY.ANY),
    column: Node.PARAM.STRING(),
    minOrEqual: Node.PARAM.NULLABLE(Node.PARAM.NUMBER()),
    maxOrEqual: Node.PARAM.NULLABLE(Node.PARAM.NUMBER()),
    min: Node.PARAM.NULLABLE(Node.PARAM.NUMBER()),
    max: Node.PARAM.NULLABLE(Node.PARAM.NUMBER())
};

var FilterRange = Node.create(TYPE, PARAMS, {
    beforeCreate: function () {
        this.range = new Range({ name: this.column }, {
            minOrEqual: this.minOrEqual,
            maxOrEqual: this.maxOrEqual,
            min: this.min,
            max: this.max
        });
    }
});

module.exports = FilterRange;

FilterRange.prototype.sql = function() {
    return this.range.sql(this.source.getQuery());
};
