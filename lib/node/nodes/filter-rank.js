'use strict';

var Node = require('../node');
var Rank = require('../../filter/rank');

var TYPE = 'filter-rank';
var PARAMS = {
    source: Node.PARAM.NODE(Node.GEOMETRY.ANY),
    column: Node.PARAM.STRING(),
    rank: Node.PARAM.ENUM('top', 'bottom'),
    limit: Node.PARAM.NUMBER(),
    action: Node.PARAM.NULLABLE(Node.PARAM.ENUM('show', 'hide'), 'show')
};

var FilterRank = Node.create(TYPE, PARAMS, {
    beforeCreate: function (node) {
        node.rank = new Rank({ name: node.column }, {
            rank: node.rank,
            limit: node.limit,
            action: node.action
        });
    }
});

module.exports = FilterRank;
module.exports.TYPE = TYPE;
module.exports.PARAMS = PARAMS;

FilterRank.prototype.sql = function() {
    return this.rank.sql(this.source.getQuery());
};
