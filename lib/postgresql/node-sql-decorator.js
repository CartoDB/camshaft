'use strict';

var dot = require('dot');
dot.templateSettings.strip = false;

function NodeSqlDecorator(node) {
    this.node = node;
}

module.exports = NodeSqlDecorator;


var createQueryTemplate = dot.template([
    'CREATE TABLE {{=it._targetTableName}} AS',
    'SELECT * FROM ({{=it._query}}) _analysis_create_table_query',
    'LIMIT 0'
].join('\n'));
NodeSqlDecorator.prototype.createTableQuery = function() {
    return createQueryTemplate({
        _targetTableName: this.node.getTargetTable(),
        _query: this.node.sql()
    });
};
