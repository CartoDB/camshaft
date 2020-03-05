'use strict';

var Node = require('../node');
var GroupedRank = require('../../filter/grouped-rank');

var TYPE = 'filter-grouped-rank';
var PARAMS = {
    source: Node.PARAM.NODE(Node.GEOMETRY.ANY),
    column: Node.PARAM.STRING(),
    rank: Node.PARAM.ENUM('top', 'bottom'),
    group: Node.PARAM.STRING(),
    min: Node.PARAM.NULLABLE(Node.PARAM.NUMBER()),
    max: Node.PARAM.NULLABLE(Node.PARAM.NUMBER())
};

var FilterGroupedRank = Node.create(TYPE, PARAMS, {
    cache: true,
    beforeCreate: function () {
        this.groupedRank = new GroupedRank({ name: this.column }, {
            rank: this.rank,
            group: this.group,
            min: this.min,
            max: this.max
        });
    }
});

module.exports = FilterGroupedRank;

FilterGroupedRank.prototype.sql = function () {
    return this.groupedRank.sql(this.source.getQuery());
};
