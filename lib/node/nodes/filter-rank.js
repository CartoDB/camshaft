'use strict';

var Node = require('../node');

var TYPE = 'filter-rank';
var PARAMS = {
    source: Node.PARAM.NODE(Node.GEOMETRY.ANY),
    column: Node.PARAM.STRING(),
    rank: Node.PARAM.ENUM('top', 'bottom'),
    limit: Node.PARAM.NUMBER(),
    action: Node.PARAM.NULLABLE(Node.PARAM.ENUM('show', 'hide'), 'show')
};

var FilterRank = Node.create(TYPE, PARAMS, { cache: true });

module.exports = FilterRank;
module.exports.TYPE = TYPE;
module.exports.PARAMS = PARAMS;

var filterRankTemplate = Node.template([
    'SELECT *',
    'FROM ({{=it._query}}) _analysis_filter_rank',
    'ORDER BY {{=it._column}} {{=it._orderDirection}}',
    '{{=it._showHideAction}} {{=it._limitNumber}}'
].join('\n'));

FilterRank.prototype.sql = function() {
    return filterRankTemplate({
        _query: this.source.getQuery(),
        _column: this.column,
        _orderDirection: (this.rank === 'bottom' ? 'ASC' : 'DESC'),
        _showHideAction: (this.action === 'hide' ? 'OFFSET' : 'LIMIT'),
        _limitNumber: this.limit
    });
};
