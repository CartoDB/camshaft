'use strict';

var dot = require('dot');
dot.templateSettings.strip = false;

var rankQueryTemplate = dot.template([
    'SELECT *',
    'FROM ({{=it._query}}) _analysis_filter_rank',
    'ORDER BY {{=it._column}} {{=it._orderDirection}}',
    '{{=it._showHideAction}} {{=it._limitNumber}}'
].join('\n'));

function Rank(column, filterParams) {
    this.column = column.name;
    this.rank = filterParams.rank;
    this.limit = filterParams.limit;
    this.action = filterParams.action;
}

module.exports = Rank;

Rank.prototype.sql = function(rawSql) {
    return rankQueryTemplate({
        _query: rawSql,
        _column: this.column,
        _orderDirection: (this.rank === 'bottom' ? 'ASC' : 'DESC'),
        _showHideAction: (this.action === 'hide' ? 'OFFSET' : 'LIMIT'),
        _limitNumber: this.limit
    });
};
