'use strict';

var Node = require('../node');
var Range = require('../../filter/range');

var TYPE = 'filter-range';
var PARAMS = {
    source: Node.PARAM.NODE(Node.GEOMETRY.ANY),
    column: Node.PARAM.STRING(),
    min: Node.PARAM.NULLABLE(Node.PARAM.NUMBER()),
    max: Node.PARAM.NULLABLE(Node.PARAM.NUMBER())
};

var FilterRange = Node.create(TYPE, PARAMS, {
    beforeCreate: function (node) {
        node.range = new Range({ name: node.column }, {
            min: node.min,
            max: node.max
        });
    }
});

module.exports = FilterRange;

FilterRange.prototype.sql = function() {
    return this.range.sql(this.source.getQuery());
};
