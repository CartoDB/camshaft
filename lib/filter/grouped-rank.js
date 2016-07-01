'use strict';

var dot = require('dot');
dot.templateSettings.strip = false;

var Range = require('./range');

var groupRankQueryTemplate = dot.template([
    'SELECT *,',
    '  rank() OVER (',
    '    PARTITION BY {{=it._groupColumn}}',
    '    ORDER BY {{=it._orderColumn}} {{=it._orderDirection}}',
    '  ) AS rank',
    'FROM ({{=it._query}}) _cdb_filter_grouped_rank',
].join('\n'));

function GroupedRank(column, filterParams) {
    this.column = column.name;
    this.rank = filterParams.rank;
    this.group = filterParams.group;
    this.rangeFilter = new Range({ name: 'rank' }, {
        min: filterParams.minRank,
        max: filterParams.maxRank
    });
}

module.exports = GroupedRank;

GroupedRank.prototype.sql = function(rawSql) {
    var groupRankQuery = groupRankQueryTemplate({
        _query: rawSql,
        _orderColumn: this.column,
        _groupColumn: this.group,
        _orderDirection: (this.rank === 'bottom' ? 'ASC' : 'DESC'),
    });

    return this.rangeFilter.sql(groupRankQuery);
};
