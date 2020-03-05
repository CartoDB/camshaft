'use strict';

var dot = require('dot');
dot.templateSettings.strip = false;

function NodeSqlAdapter (node) {
    this.node = node;
}

module.exports = NodeSqlAdapter;

var createQueryTemplate = dot.template([
    'CREATE TABLE {{=it._targetTableName}} AS',
    'SELECT * FROM ({{=it._query}}) _analysis_create_table_query',
    'LIMIT 0'
].join('\n'));
NodeSqlAdapter.prototype.createTableQuery = function () {
    var createTableQuery = this.node.createTableSql();
    return (createTableQuery !== null)
        ? createTableQuery
        : createQueryTemplate({
            _targetTableName: this.node.getTargetTable(),
            _query: this.node.sql()
        });
};

NodeSqlAdapter.prototype.deleteFromCacheTableQuery = function () {
    return 'DELETE FROM ' + this.node.getTargetTable();
};

NodeSqlAdapter.prototype.populateCacheTableQuery = function () {
    var populateTableQuery = this.node.populateTableSql();
    return (populateTableQuery !== null)
        ? populateTableQuery
        : 'INSERT INTO ' + this.node.getTargetTable() + ' ' + this.node.sql();
};

NodeSqlAdapter.prototype.checkCacheTableQuery = function () {
    return 'SELECT CDB_CheckAnalysisQuota(\'' + this.node.getTargetTable() + '\')';
};

NodeSqlAdapter.prototype.createGeomIndexCacheTableQuery = function () {
    return 'CREATE INDEX ON ' +
        this.node.getTargetTable() +
        ' USING GIST (ST_Transform(the_geom, 3857))';
};

NodeSqlAdapter.prototype.analyzeTableQuery = function () {
    return 'ANALYZE ' + this.node.getTargetTable();
};

NodeSqlAdapter.prototype.annotatedNodeType = function () {
    return '/* analysis:' + this.node.getType() + ' */';
};

NodeSqlAdapter.prototype.preCheckNodeQuery = function () {
    if (this.node.preCheckQuery) {
        return this.node.preCheckQuery();
    }
};
