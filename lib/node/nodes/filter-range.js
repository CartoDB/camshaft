'use strict';

var Node = require('../node');
var Range = require('../../filter/range');

var TYPE = 'filter-range';
var PARAMS = {
    source: Node.PARAM.NODE(Node.GEOMETRY.ANY),
    column: Node.PARAM.STRING(),
    min: Node.PARAM.NULLABLE(Node.PARAM.NUMBER()),
    max: Node.PARAM.NULLABLE(Node.PARAM.NUMBER()),
    greater_than: Node.PARAM.NULLABLE(Node.PARAM.NUMBER()),
    greater_than_or_equal: Node.PARAM.NULLABLE(Node.PARAM.NUMBER()),
    less_than: Node.PARAM.NULLABLE(Node.PARAM.NUMBER()),
    less_than_or_equal: Node.PARAM.NULLABLE(Node.PARAM.NUMBER()),
};

var FilterRange = Node.create(TYPE, PARAMS, {
    beforeCreate: function () {
        this.range = new Range({ name: this.column }, {
            min: this.min,
            max: this.max,
            greater_than: this.greater_than,
            greater_than_or_equal: this.greater_than_or_equal,
            less_than: this.less_than,
            less_than_or_equal: this.less_than_or_equal
        });
    }
});

module.exports = FilterRange;

FilterRange.prototype.sql = function() {
    return this.range.sql(this.source.getQuery());
};
