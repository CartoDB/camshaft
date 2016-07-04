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
    beforeCreate: function (node) {
        node.groupedRank = new GroupedRank({ name: node.column }, {
            rank: node.rank,
            group: node.group,
            min: node.min,
            max: node.max
        });
    }
});

module.exports = FilterGroupedRank;
module.exports.TYPE = TYPE;
module.exports.PARAMS = PARAMS;

FilterGroupedRank.prototype.sql = function() {
    return this.groupedRank.sql(this.source.getQuery());
};
