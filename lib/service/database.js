'use strict';

var dot = require('dot');
dot.templateSettings.strip = false;

var debug = require('../util/debug')('database-service');

var QueryRunner = require('../postgresql/query-runner');
var QueryParser = require('../postgresql/query-parser');
var BatchClient = require('../postgresql/batch-client');

var QUERY_RUNNER_READONLY_OP = true;
var QUERY_RUNNER_WRITE_OP = !QUERY_RUNNER_READONLY_OP;

var createQueryTemplate = dot.template([
    'CREATE TABLE {{=it._targetTableName}} AS',
    '{{=it._query}}',
    'LIMIT 0'
].join('\n'));

function DatabaseService(username, apiKey, dbParams) {
    this.dbParams = dbParams;
    this.queryRunner = new QueryRunner(dbParams);
    this.queryParser = new QueryParser(this.queryRunner);
    this.batchClient = new BatchClient(username, apiKey);
}

module.exports = DatabaseService;

DatabaseService.prototype.run = function(query, callback) {
    this.queryRunner.run(query, QUERY_RUNNER_READONLY_OP, callback);
};

DatabaseService.prototype.getAffectedTables = function(query, callback) {
    return callback(null, []);
};

DatabaseService.prototype.createTable = function(targetTableName, query, callback) {
    var createQuery = createQueryTemplate({
        _targetTableName: targetTableName,
        _query: query
    });

    this.queryRunner.run(createQuery, QUERY_RUNNER_WRITE_OP, function(err, resultSet) {
        debug('TODO: register table');
        return callback(err, resultSet);
    });
};

DatabaseService.prototype.getSchema = function(query, callback) {
    this.queryParser.getSchema(query, callback);
};

DatabaseService.prototype.enqueue = function(query, callback) {
    this.batchClient.enqueue(query, callback);
};

var registerNodeQueryTemplate = dot.template([
    'SELECT',
    '    \'{{=it._nodeId}}\',',
    '    \'{{=it._analysisDef}}\'::json,',
    '    {{=it._inputNodes}},',
    '    {{=it._affectedTables}},',
    '    {{=it._cacheTables}}',
    'WHERE NOT EXISTS (SELECT * FROM cdb_analysis_catalog WHERE node_id = \'{{=it._nodeId}}\')'
].join('\n'));

var EMPTY_ARRAY_SQL = '\'{}\'';
function pgArray(input, cast) {
    if (input.length === 0) {
        return cast ? ('ARRAY[]::' + cast + '[]') : EMPTY_ARRAY_SQL;
    }
    return 'ARRAY[' + input.join(', ') + ']';
}

function pgQuoteCastMapper(cast) {
    return function(input) {
        return '\'' + input + '\'' + (cast ? ('::' + cast) : '');
    };
}

DatabaseService.prototype.registerNodesInCatalog = function(nodes, callback) {
    if (!Array.isArray(nodes) || nodes.length === 0) {
        return callback(null);
    }
    var nodesSql = [];
    nodes.forEach(function(node) {
        nodesSql.push(registerNodeQueryTemplate({
            _nodeId: node.id(),
            _inputNodes: pgArray(
                node.getInputNodes().map(function(node) { return node.id(); }).map(pgQuoteCastMapper()), 'char[40]'
            ),
            _analysisDef: JSON.stringify(node.toJSON()),
            _affectedTables: pgArray(node.getAffectedTables().map(pgQuoteCastMapper('regclass')), 'regclass'),
            _cacheTables: pgArray(node.getCacheTables().map(pgQuoteCastMapper('regclass')), 'regclass')
        }));
    });
    var sql = 'INSERT INTO cdb_analysis_catalog' +
        '(node_id, analysis_def, input_nodes, affected_tables, cache_tables)\n' + nodesSql.join('\nUNION ALL\n');

    debug('Registering node with SQL: %s', sql);
    this.queryRunner.run(sql, QUERY_RUNNER_WRITE_OP, function(err, resultSet) {
        debug(err, resultSet);
        return callback(err);
    });
};

var trackNodeQueryTemplate = dot.template([
    'WITH RECURSIVE search_dag(node_id, input_nodes) AS (',
    '    SELECT node_id, input_nodes FROM cdb_analysis_catalog WHERE node_id = \'{{=it._nodeId}}\'',
    '    UNION',
    '    -- recursive search',
    '    SELECT c.node_id, c.input_nodes',
    '    FROM search_dag s, cdb_analysis_catalog c',
    '    WHERE c.node_id = ANY(s.input_nodes)',
    ')',
    'UPDATE cdb_analysis_catalog',
    'SET',
    '    used_at = NOW(),',
    '    hits = hits + 1,',
    '    last_used_from = \'{{=it._nodeId}}\'',
    'WHERE node_id IN (select node_id from search_dag)',
].join('\n'));

DatabaseService.prototype.trackNode = function(node, callback) {
    var sql = trackNodeQueryTemplate({ _nodeId: node.id() });
    debug('Tracking analysis with SQL: %s', sql);
    this.queryRunner.run(sql, QUERY_RUNNER_WRITE_OP, function(err, resultSet) {
        debug(err, resultSet);
        return callback(err);
    });
};
