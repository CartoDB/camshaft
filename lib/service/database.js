'use strict';

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
    'SELECT * FROM ({{=it._query}}) _analysis_create_table_query',
    'LIMIT 0'
].join('\n'));

function DatabaseService(user, dbParams, batchParams) {
    this.user = user;
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

DatabaseService.prototype.getLastUpdatedTimeFromAffectedTables = function(node, skip, callback) {
    if (!!skip || node.type !== Source.TYPE || node.getUpdatedAt() !== null) {
        return callback(null, node.getUpdatedAt());
    }

    var sql = node.sql()
        .replace(affectedTableRegexCache.bbox, 'ST_MakeEnvelope(0,0,0,0)')
        .replace(affectedTableRegexCache.scaleDenominator, '0')
        .replace(affectedTableRegexCache.pixelWidth, '1')
        .replace(affectedTableRegexCache.pixelHeight, '1');
    sql = 'SELECT max(updated_at) FROM CDB_QueryTables_Updated_At($camshaft$' + sql + '$camshaft$)';

    this.queryRunner.run(sql, QUERY_RUNNER_READONLY_OP, function(err, resultSet) {
        if (err) {
            return callback(err);
        }

        var defaultLastUpdatedTime = new Date('1970-01-01T00:00:00.000Z');
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

var DUPLICATED_TABLE_ERROR_CODES = {
    '42P07': true, // duplicate_table
    '42710': true, // duplicate_object
    '23505': true  // unique_violation
};

DatabaseService.prototype.createTableIfNotExists = function(targetTableName, outputQuery, callback) {
    var self = this;
    this.tableExists(targetTableName, function(err, tableExists) {
        if (tableExists) {
            return callback(null, tableExists);
        }

        self.createTable(targetTableName, outputQuery, function(err) {
            if (err && !DUPLICATED_TABLE_ERROR_CODES[err.code]) {
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
    '    \'{{=it._user}}\',',
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

DatabaseService.prototype.registerAnalysisInCatalog = function(analysis, callback) {
    var nodes = analysis.getSortedNodes();
    if (!Array.isArray(nodes) || nodes.length === 0 || analysis.getRoot().type === Source.TYPE) {
        return callback(null);
    }
    var user = this.user;
    var nodesSql = [];
    nodes.forEach(function(node) {
        debug(node.type, node.getUpdatedAt());
        var updatedAt = node.getUpdatedAt();
        updatedAt = (updatedAt === null ? 'NULL' : 'TIMESTAMP WITH TIME ZONE \'' + updatedAt.toISOString() + '\'');
        var inputNodes = pgArray(
            node.getInputNodes().map(function(node) { return node.id(); }).map(pgQuoteCastMapper()), 'char[40]'
        );
        var analysisDef = JSON.stringify(node.toJSON());

        nodesSql.push(registerNodeQueryTemplate({
            _user: user,
            _nodeId: node.id(),
            _inputNodes: inputNodes,
            _updatedAt: updatedAt,
            _status: node.getStatus(),
            _analysisDef: analysisDef
        }));
        // we want to register also the cache version of the node
        if (node.shouldCacheQuery()) {
            nodesSql.push(registerNodeQueryTemplate({
                _user: user,
                _nodeId: node.cachedNodeId(),
                _inputNodes: inputNodes,
                _updatedAt: updatedAt,
                _status: node.getStatus(),
                _analysisDef: analysisDef
            }));
        }
    });
    var sql = 'INSERT INTO cdb_analysis_catalog' +
        '(username, node_id, analysis_def, input_nodes, updated_at, status)\n' + nodesSql.join('\nUNION ALL\n') +
        'ON CONFLICT (node_id) DO NOTHING';

    debug('Registering node with SQL: %s', sql);
    this.queryRunner.run(sql, QUERY_RUNNER_WRITE_OP, function(err, resultSet) {
        debug(err, resultSet);
        return callback(err);
    });
};

function transactionQuery(queries) {
    return ['BEGIN'].concat(queries).concat('COMMIT').join(';') + ';';
}

function deleteFromCacheTableQuery(targetTableName) {
    return 'DELETE FROM ' + targetTableName;
}

function populateCacheTableQuery(targetTableName, outputQuery) {
    return 'INSERT INTO ' + targetTableName + ' ' + outputQuery;
}

function updateNodeAtAnalysisCatalogQuery(nodeIds, columns) {
    nodeIds = Array.isArray(nodeIds) ? nodeIds : [nodeIds];
    return [
        'UPDATE cdb_analysis_catalog SET',
        columns.join(','),
        'WHERE node_id IN (' + nodeIds.map(pgQuoteCastMapper()).join(', ') + ')'
    ].join('\n');
}

function updateNodeStatusAtAnalysisCatalogQuery(nodeIds, status) {
    return updateNodeAtAnalysisCatalogQuery(nodeIds, [
        'status = \'' + status + '\'',
        'updated_at = NOW()'
    ]);
}

function updateNodeAtAnalysisCatalogForJobResultQuery(nodeIds, status, isError) {
    var columns = [
        'status = \'' + status + '\'',
        'last_modified_by = \'<%= job_id %>\'',
        'updated_at = NOW()'
    ];

    if (isError) {
        columns.push('last_error_message = $last_error_message$<%= error_message %>$last_error_message$');
    }

    return updateNodeAtAnalysisCatalogQuery(nodeIds, columns);
}

DatabaseService.prototype.queueAnalysisOperations = function(analysis, callback) {
    if (analysis.getRoot().type === Source.TYPE) {
        return callback(null);
    }

    var self = this;

    var sortedNodes = analysis.getSortedNodes();
    var sortedNodesIds = sortedNodes.map(function(node) {
        return node.cachedNodeId();
    });
    var nodesById = analysis.getNodes().reduce(function(byId, node) {
        if (!byId.hasOwnProperty(node.cachedNodeId())) {
            byId[node.cachedNodeId()] = [];
        }
        byId[node.cachedNodeId()].push(node);
        return byId;
    }, {});
    var query = [
        'SELECT node_id, updated_at, status, last_error_message',
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
                    node.setErrorMessage(row.last_error_message || null);
                });
            }
        });

        var nodesToQueueForUpdate = sortedNodes.filter(function(node) {
            return node.isOutdated();
        });

        var asyncQueries = [];

        // we want to mark all nodes updated_at to NOW() before doing any work on them
        nodesToQueueForUpdate.forEach(function(nodeToUpdate) {
            nodeToUpdate.setStatusFromInputNodes();
            var nodeIds = [nodeToUpdate.id(), nodeToUpdate.cachedNodeId()];
            asyncQueries.push({
                query: updateNodeStatusAtAnalysisCatalogQuery(nodeIds, nodeToUpdate.getStatus()),
                onerror: updateNodeStatusAtAnalysisCatalogQuery(nodeIds, Node.STATUS.FAILED)
            });
        });

        nodesToQueueForUpdate.forEach(function(nodeToUpdate) {
            if (nodeToUpdate.shouldCacheQuery()) {
                var nodeIds = [nodeToUpdate.id(), nodeToUpdate.cachedNodeId()];
                var targetTableName = nodeToUpdate.getTargetTable();
                asyncQueries.push({
                    query: updateNodeStatusAtAnalysisCatalogQuery(nodeIds, Node.STATUS.RUNNING)
                });
                asyncQueries.push({
                    query: transactionQuery([
                        deleteFromCacheTableQuery(targetTableName),
                        populateCacheTableQuery(targetTableName, nodeToUpdate.sql())
                    ]),
                    onsuccess: updateNodeAtAnalysisCatalogForJobResultQuery(nodeIds, Node.STATUS.READY),
                    onerror: updateNodeAtAnalysisCatalogForJobResultQuery(nodeIds, Node.STATUS.FAILED, true)
                });
            } else {
                asyncQueries.push({
                    query: updateNodeStatusAtAnalysisCatalogQuery(nodeToUpdate.id(), Node.STATUS.READY),
                    onerror: updateNodeStatusAtAnalysisCatalogQuery(nodeToUpdate.id(), Node.STATUS.FAILED)
                });
            }
        });

        if (asyncQueries.length) {
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
