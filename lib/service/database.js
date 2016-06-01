'use strict';

var async = require('async');
var dot = require('dot');
dot.templateSettings.strip = false;

var Node = require('../node/node');
var Source = require('../node/nodes/source');

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

function DatabaseService(dbParams, batchParams) {
    this.queryRunner = new QueryRunner(dbParams);
    this.queryParser = new QueryParser(this.queryRunner);

    var inlineExecution = batchParams.inlineExecution || false;
    var hostHeaderTemplate = batchParams.hostHeaderTemplate || '{{=it.username}}.localhost.lan';
    this.batchClient = new BatchClient(
        batchParams.endpoint,
        batchParams.username,
        batchParams.apiKey,
        hostHeaderTemplate,
        inlineExecution,
        this.queryRunner
    );
}

module.exports = DatabaseService;

DatabaseService.prototype.run = function(query, callback) {
    this.queryRunner.run(query, QUERY_RUNNER_READONLY_OP, callback);
};

var affectedTableRegexCache = {
    bbox: /!bbox!/g,
    scaleDenominator: /!scale_denominator!/g,
    pixelWidth: /!pixel_width!/g,
    pixelHeight: /!pixel_height!/g
};

DatabaseService.prototype.getLastUpdatedTimeFromAffectedTables = function(sql, callback) {
    sql = sql
        .replace(affectedTableRegexCache.bbox, 'ST_MakeEnvelope(0,0,0,0)')
        .replace(affectedTableRegexCache.scaleDenominator, '0')
        .replace(affectedTableRegexCache.pixelWidth, '1')
        .replace(affectedTableRegexCache.pixelHeight, '1');
    sql = 'SELECT max(updated_at) FROM CDB_QueryTables_Updated_At($camshaft$' + sql + '$camshaft$)';

    this.queryRunner.run(sql, QUERY_RUNNER_READONLY_OP, function(err, resultSet) {
        if (err) {
            return callback(err);
        }

        var defaultLastUpdatedTime = new Date();
        var rows = resultSet.rows || [defaultLastUpdatedTime];
        var lastUpdatedTimeFromAffectedTables = (rows[0] && rows[0].max) || defaultLastUpdatedTime;

        return callback(null, lastUpdatedTimeFromAffectedTables);
    });
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

DatabaseService.prototype.tableExists = function(targetTableName, callback) {
    var existsQuery = 'select * from ' + targetTableName + ' limit 0';
    this.queryRunner.run(existsQuery, QUERY_RUNNER_READONLY_OP, function(err, resultSet) {
        var tableExists = !err && resultSet;
        return callback(null, tableExists);
    });
};

DatabaseService.prototype.createTableIfNotExists = function(targetTableName, outputQuery, callback) {
    var self = this;
    this.tableExists(targetTableName, function(err, tableExists) {
        if (tableExists) {
            return callback(null, tableExists);
        }

        self.createTable(targetTableName, outputQuery, function(err) {
            if (err) {
                return callback(err, tableExists);
            }

            return callback(null, tableExists);
        });
    });
};

DatabaseService.prototype.getColumnNames = function(query, callback) {
    this.queryParser.getColumnNames(query, callback);
};

DatabaseService.prototype.getColumns = function(query, callback) {
    this.queryParser.getColumns(query, callback);
};

DatabaseService.prototype.enqueue = function(queries, callback) {
    this.batchClient.enqueue(queries, callback);
};

var registerNodeQueryTemplate = dot.template([
    'SELECT',
    '    \'{{=it._nodeId}}\',',
    '    $json_def${{=it._analysisDef}}$json_def$::json,',
    '    {{=it._inputNodes}},',
    '    {{=it._updatedAt}},',
    '    \'{{=it._status}}\'',
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

DatabaseService.prototype.setUpdatedAtForSources = function(analysis, callback) {
    if (analysis.getRoot().type === Source.TYPE) {
        return callback(null);
    }

    var self = this;

    var sourceNodes = analysis.getNodes().filter(function(node) { return node.type === Source.TYPE; });
    async.map(sourceNodes,
        function(node, done) {
            node.getAndSetUpdatedAt(self, done);
        },
        callback
    );
};

DatabaseService.prototype.registerAnalysisInCatalog = function(analysis, callback) {
    var nodes = analysis.getSortedNodes();
    if (!Array.isArray(nodes) || nodes.length === 0 || analysis.getRoot().type === Source.TYPE) {
        return callback(null);
    }
    var nodesSql = [];
    nodes.forEach(function(node) {
        debug(node.type, node.getUpdatedAt());
        var updatedAt = node.getUpdatedAt();
        nodesSql.push(registerNodeQueryTemplate({
            _nodeId: node.id(),
            _inputNodes: pgArray(
                node.getInputNodes().map(function(node) { return node.id(); }).map(pgQuoteCastMapper()), 'char[40]'
            ),
            _updatedAt: (updatedAt === null ? 'NULL' : 'TIMESTAMP WITH TIME ZONE \'' + updatedAt.toISOString() + '\''),
            _status: node.getStatus(),
            _analysisDef: JSON.stringify(node.toJSON())
        }));
    });
    var sql = 'INSERT INTO cdb_analysis_catalog' +
        '(node_id, analysis_def, input_nodes, updated_at, status)\n' + nodesSql.join('\nUNION ALL\n');

    debug('Registering node with SQL: %s', sql);
    this.queryRunner.run(sql, QUERY_RUNNER_WRITE_OP, function(err, resultSet) {
        debug(err, resultSet);
        return callback(err);
    });
};

function deleteFromCacheTableQuery(targetTableName) {
    return 'DELETE FROM ' + targetTableName;
}

function populateCacheTableQuery(targetTableName, outputQuery) {
    return 'INSERT INTO ' + targetTableName + ' ' + outputQuery;
}

function updateNodeAtAnalysisCatalogQuery(nodeId, status) {
    return [
        'UPDATE cdb_analysis_catalog SET',
            'status = \'' + status + '\',',
        'updated_at = NOW()',
            'WHERE node_id = \'' + nodeId + '\''
    ].join('\n');
}

DatabaseService.prototype.queueAnalysisOperations = function(analysis, callback) {
    if (analysis.getRoot().type === Source.TYPE) {
        return callback(null);
    }

    var self = this;

    var sortedNodes = analysis.getSortedNodes();
    var sortedNodesIds = sortedNodes.map(function(node) { return node.id(); });
    var nodesById = analysis.getNodes().reduce(function(byId, node) {
        if (!byId.hasOwnProperty(node.id())) {
            byId[node.id()] = [];
        }
        byId[node.id()].push(node);
        return byId;
    }, {});
    var query = [
        'SELECT node_id, updated_at, status',
        'FROM cdb_analysis_catalog',
        'WHERE node_id IN (',
            sortedNodesIds
                .filter(function(node) { return node.type !== Source.TYPE; })
                .map(pgQuoteCastMapper()),
        ')'
    ].join('\n');

    this.queryRunner.run(query, function(err, resultSet) {
        if (err) {
            return callback(err);
        }

        var rows = resultSet.rows || [];
        rows.forEach(function(row) {
            var nodeId = row.node_id;
            var nodes = nodesById[nodeId];
            if (nodes) {
                nodes.forEach(function(node) {
                    node.setUpdatedAt(row.updated_at || null);
                    node.setStatus(row.status);
                });
            }
        });

        var nodesToQueueForUpdate = [];

        sortedNodes.forEach(function(node) {
            var inputNodes = node.getInputNodes();
            var startingLastUpdate = (inputNodes.length > 0 ? null : node.getUpdatedAt());
            var inputNodesLastUpdate = inputNodes.reduce(function(lastUpdate, inputNode) {
                var inputNodeUpdatedAt = inputNode.getUpdatedAt();

                if (inputNodeUpdatedAt === null) {
                    return new Date();
                }

                if (lastUpdate === null) {
                    return inputNodeUpdatedAt;
                }

                return lastUpdate.getTime() > inputNodeUpdatedAt.getTime() ? lastUpdate : inputNodeUpdatedAt;
            }, startingLastUpdate);

            var nodeUpdatedAt = node.getUpdatedAt();
            if (nodeUpdatedAt === null || inputNodesLastUpdate.getTime() > nodeUpdatedAt.getTime()) {
                nodesToQueueForUpdate.push(node);
            }
        });

        var asyncQueries = [];

        // we want to mark all nodes updated_at to NOW() and status to pending before doing any work on them
        nodesToQueueForUpdate.forEach(function(nodeToUpdate) {
            nodeToUpdate.setStatusFromInputNodes();
            asyncQueries.push(updateNodeAtAnalysisCatalogQuery(nodeToUpdate.id(), nodeToUpdate.getStatus()));
        });

        nodesToQueueForUpdate.forEach(function(nodeToUpdate) {
            if (nodeToUpdate.shouldCacheQuery()) {
                var targetTableName = nodeToUpdate.getTargetTable();
                asyncQueries.push(deleteFromCacheTableQuery(targetTableName));
                asyncQueries.push(updateNodeAtAnalysisCatalogQuery(nodeToUpdate.id(), Node.STATUS.RUNNING));
                asyncQueries.push(populateCacheTableQuery(targetTableName, nodeToUpdate.sql()));
            }
            asyncQueries.push(updateNodeAtAnalysisCatalogQuery(nodeToUpdate.id(), Node.STATUS.READY));
        });

        if (asyncQueries.length > 0) {
            return self.enqueue(asyncQueries, callback);
        } else {
            return callback(null);
        }
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
    'WHERE node_id IN (select node_id from search_dag)'
].join('\n'));

DatabaseService.prototype.trackAnalysis = function(analysis, callback) {
    var node = analysis.getRoot();

    // we don't want to track source nodes as high level nodes
    if (node.type === Source.TYPE) {
        return callback(null);
    }
    var sql = trackNodeQueryTemplate({ _nodeId: node.id() });
    debug('Tracking analysis with SQL: %s', sql);
    this.queryRunner.run(sql, QUERY_RUNNER_WRITE_OP, function(err, resultSet) {
        debug(err, resultSet);
        return callback(err);
    });
};
