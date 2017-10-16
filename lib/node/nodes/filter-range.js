'use strict';

var Node = require('../node');
var Range = require('../../filter/range');

var TYPE = 'filter-range';
var PARAMS = {
    source: Node.PARAM.NODE(Node.GEOMETRY.ANY),
    column: Node.PARAM.STRING(),
    min_or_equal: Node.PARAM.NULLABLE(Node.PARAM.NUMBER()),
    max_or_equal: Node.PARAM.NULLABLE(Node.PARAM.NUMBER()),
    min: Node.PARAM.NULLABLE(Node.PARAM.NUMBER()),
    max: Node.PARAM.NULLABLE(Node.PARAM.NUMBER())
};

var FilterRange = Node.create(TYPE, PARAMS, {
    beforeCreate: function () {
        this.range = new Range({ name: this.column }, {
            min_or_equal: this.min_or_equal,
            max_or_equal: this.max_or_equal,
            min: this.min,
            max: this.max
        });
    }
});

module.exports = FilterRange;

FilterRange.prototype.sql = function() {
    return this.range.sql(this.source.getQuery());
};
