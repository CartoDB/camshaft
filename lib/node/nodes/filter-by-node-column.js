'use strict';

var Node = require('../node');

var TYPE = 'filter-by-node-column';
var PARAMS = {
    source: Node.PARAM.NODE(Node.GEOMETRY.ANY),
    column: Node.PARAM.STRING(),
    filter_source: Node.PARAM.NODE(Node.GEOMETRY.ANY),
    filter_column: Node.PARAM.STRING()
};

var FilterByColumn = Node.create(TYPE, PARAMS, { cache: true, version: 1 });

module.exports = FilterByColumn;

FilterByColumn.prototype.sql = function() {
    return queryTemplate({
        _source_query: this.source.getQuery(),
        _column: this.column,
        _filter_source_query: this.filter_source.getQuery(),
        _filter_column: this.filter_column
    });
};

var queryTemplate = Node.template([
    'SELECT * FROM ({{=it._source_query}}) _filter_by_column_source',
    'WHERE {{=it._column}} IN (',
    '  SELECT {{=it._filter_column}} FROM ({{=it._filter_source_query}}) _filter_by_column_filter_source',
    ')'
].join('\n'));
