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
    cache: true,
    beforeCreate: function () {
        this.rank = new Rank({ name: this.column }, {
            rank: this.rank,
            limit: this.limit,
            action: this.action
        });
    }
});

module.exports = FilterRank;

FilterRank.prototype.sql = function () {
    return this.rank.sql(this.source.getQuery());
};
