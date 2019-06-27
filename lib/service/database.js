'use strict';

var dot = require('dot');
dot.templateSettings.strip = false;

var Node = require('../node/node');
var Source = require('../node/nodes/source');

var debug = require('../util/debug')('database-service');

var QueryRunner = require('../postgresql/query-runner');
var QueryParser = require('../postgresql/query-parser');
var BatchClient = require('../postgresql/batch-client');
var queries = require('../postgresql/queries');
var NodeSqlAdapter = require('../postgresql/node-sql-adapter');

var QUERY_RUNNER_READONLY_OP = true;
var QUERY_RUNNER_WRITE_OP = !QUERY_RUNNER_READONLY_OP;


function DatabaseService(user, dbParams, batchParams, limits) {
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

    this.limits = limits || {};
    this.limits.analyses = this.limits.analyses || {};
    debug('limits', this.limits);

    this.createdTableNodes = {};
}

module.exports = DatabaseService;

DatabaseService.prototype.run = function(query, callback) {
    this.queryRunner.run(query, QUERY_RUNNER_READONLY_OP, callback);
};

DatabaseService.prototype.getMetadataFromAffectedTables = function(node, skip, callback) {
    if (!!skip || node.type !== Source.TYPE || node.getUpdatedAt() !== null) {
        var data = {'last_update': node.getUpdatedAt(),
                    'affected_tables': node.getAffectedTables()};
        return callback(null, data);
    }

    checkForeignTable(this.queryRunner, node, (err, hasForeignTables) => {
        if (err) {
            return callback(err);
        }

        if (hasForeignTables) {
            var data = {
                'last_update': node.getUpdatedAt(),
                'affected_tables': node.getAffectedTables()
            };

            return callback(null, data);
        }


        var sql = queries.replaceTokens(node.sql());
        sql = 'SELECT updated_at, schema_name, table_name ' +
            'FROM CDB_QueryTables_Updated_At($camshaft$' + sql + '$camshaft$)';

        this.queryRunner.run(sql, QUERY_RUNNER_READONLY_OP, function(err, resultSet) {
            if (err) {
                return callback(err);
            }

            var defaultLastUpdatedTime = new Date('1970-01-01T00:00:00.000Z');
            var affectedTables = [];
            var lastUpdatedTimes = [];
            var rows = Array.isArray(resultSet.rows) ? resultSet.rows : [];

            rows.forEach(function(row) {
                lastUpdatedTimes.push((row && row.updated_at) || defaultLastUpdatedTime);
                var schema = (row && row.schema_name) || null;
                var table = (row && row.table_name) || null;
                affectedTables.push({'schema': schema, 'table': table});
            });

            var lastUpdatedTimeFromAffectedTables = (lastUpdatedTimes.length > 0) ?
                new Date(Math.max.apply(null, lastUpdatedTimes)) :
                defaultLastUpdatedTime;

            var data = {'last_update': lastUpdatedTimeFromAffectedTables,
                        'affected_tables': affectedTables};

            return callback(null, data);
        });
    });
};

function checkForeignTable (queryRunner, node, callback) {
    const sql = queries.replaceTokens(node.sql());

    const query = `
        WITH
        query_tables AS (
            SELECT unnest(CDB_QueryTablesText($windshaft$${sql}$windshaft$)) schema_table_name
        ),
        query_tables_oid AS (
            SELECT schema_table_name, schema_table_name::regclass::oid AS reloid
            FROM query_tables
        )
        SELECT
            current_database()::text AS dbname,
            quote_ident(n.nspname::text) schema_name,
            quote_ident(c.relname::text) table_name,
            c.relkind,
            query_tables_oid.reloid
        FROM query_tables_oid, pg_catalog.pg_class c
        LEFT JOIN pg_catalog.pg_namespace n ON c.relnamespace = n.oid
        WHERE c.oid = query_tables_oid.reloid
    `;

    queryRunner.run(query, QUERY_RUNNER_READONLY_OP, function (err, result) {
        if (err) {
            return callback(err);
        }

        result = result || {};
        const rows = result.rows || [];

        const hasForeignTables = rows.some(row => row.relkind === 'f');

        return callback(null, hasForeignTables);
    });
}

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

DatabaseService.prototype.createCacheTable = function(node, callback) {
    var self = this;
    if (node.shouldCacheQuery() && !self.createdTableNodes[node.id()]) {
        this.createdTableNodes[node.id()] = true;
        this.tableExists(node.getTargetTable(), function(err, tableExists) {
            if (tableExists) {
                return callback(null, tableExists);
            }

            var sqlWrappedNode = new NodeSqlAdapter(node);
            self.queryRunner.run(sqlWrappedNode.createTableQuery(), QUERY_RUNNER_WRITE_OP, function(err) {
                debug('TODO: register table');
                if (err && !DUPLICATED_TABLE_ERROR_CODES[err.code]) {
                    return callback(err, tableExists);
                }

                return callback(null, tableExists);
            });
        });
    } else {
        return callback(null, false);
    }
};

DatabaseService.prototype.getColumns = function(node, callback) {
    const applyFilters = false;
    try {
        const query = node.getQuery(applyFilters);
        return this.queryParser.getColumns(query, callback);
    } catch (err) {
        return callback(err);
    }
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
    '    {{=it._cacheTables}},',
    '    {{=it._updatedAt}},',
    '    \'{{=it._status}}\'',
    'WHERE NOT EXISTS (SELECT * FROM cdb_analysis_catalog WHERE node_id = \'{{=it._nodeId}}\')'
].join('\n'));

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
        updatedAt = updatedAt === null ?
            'NULL::timestamp' :
            'TIMESTAMP WITH TIME ZONE \'' + updatedAt.toISOString() + '\'';
        var inputNodes = queries.pgArray(
            node.getInputNodes()
                .map(function(node) {
                    return node.id();
                })
                .map(queries.pgQuoteCastMapper()),
            'char[40]'
        );
        var analysisDef = JSON.stringify(node.toJSON());

        var cacheTables = queries.pgArray(
            node.shouldCacheQuery() ? [queries.pgQuoteCastMapper('regclass')(node.getTargetTable())] : [],
            'regclass[]'
        );

        nodesSql.push(registerNodeQueryTemplate({
            _user: user,
            _nodeId: node.id(),
            _inputNodes: inputNodes,
            _cacheTables: cacheTables,
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
                _cacheTables: cacheTables,
                _updatedAt: updatedAt,
                _status: node.getStatus(),
                _analysisDef: analysisDef
            }));
        }
    });
    var sql = 'INSERT INTO cdb_analysis_catalog' +
        '(username, node_id, analysis_def, input_nodes, cache_tables, updated_at, status)\n' +
        nodesSql.join('\nUNION ALL\n') +
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

function readOnlyTransactionQuery(queries) {
    return ['BEGIN;SET TRANSACTION READ ONLY'].concat(queries).concat('COMMIT').join(';') + ';';
}

function invalidateCache(targetTableNames) {
    var invalidations = targetTableNames.map(function(tableName) {
       return 'cdb_invalidate_varnish(\'' + tableName + '\')';
    });
    return 'SELECT ' + invalidations;
}

function updateNodeAtAnalysisCatalogQuery(nodeIds, columns) {
    nodeIds = Array.isArray(nodeIds) ? nodeIds : [nodeIds];
    return [
        'UPDATE cdb_analysis_catalog SET',
        columns.join(','),
        'WHERE node_id IN (' + nodeIds.map(queries.pgQuoteCastMapper()).join(', ') + ')'
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

function asyncQueryId(analysis, node) {
    return [analysis.id(), node.id(), node.getType()].join(':');
}

DatabaseService.prototype.queueAnalysisOperations = function(analysis, callback) {
    if (analysis.getRoot().type === Source.TYPE) {
        return callback(null);
    }

    var self = this;

    this.getNodesToUpdate(analysis, function(err, nodesToQueueForUpdate) {
        if (err) {
            return callback(err);
        }

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
                var sqlWrappedNode = new NodeSqlAdapter(nodeToUpdate);
                nodeToUpdate.setQueuedWork(true);
                var nodeIds = [nodeToUpdate.id(), nodeToUpdate.cachedNodeId()];
                asyncQueries.push({
                    query: updateNodeStatusAtAnalysisCatalogQuery(nodeIds, Node.STATUS.RUNNING)
                });
                if (sqlWrappedNode.preCheckNodeQuery() !== undefined) {
                    asyncQueries.push({
                        query: readOnlyTransactionQuery([sqlWrappedNode.preCheckNodeQuery()]),
                        onerror: updateNodeAtAnalysisCatalogForJobResultQuery(nodeIds, Node.STATUS.FAILED, true)
                    });
                }
                asyncQueries.push({
                    id: asyncQueryId(analysis, nodeToUpdate),
                    timeout: nodeToUpdate.getCacheQueryTimeout(),
                    query: sqlWrappedNode.annotatedNodeType() + transactionQuery([
                        sqlWrappedNode.deleteFromCacheTableQuery(),
                        sqlWrappedNode.populateCacheTableQuery(),
                        sqlWrappedNode.createGeomIndexCacheTableQuery(),
                        sqlWrappedNode.checkCacheTableQuery(),
                        sqlWrappedNode.analyzeTableQuery()
                    ]),
                    onsuccess: updateNodeAtAnalysisCatalogForJobResultQuery(nodeIds, Node.STATUS.READY),
                    onerror: updateNodeAtAnalysisCatalogForJobResultQuery(nodeIds, Node.STATUS.FAILED, true)
                });
                var affectedTables = getSourceNodes(nodeToUpdate).reduce(function(list, node) {
                    node.getAffectedTables().forEach(function(table){
                        list[table] = ++list[table] || 1;
                    });
                    return list;
                }, {});
                asyncQueries.push({
                    query: invalidateCache(Object.keys(affectedTables))
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

DatabaseService.prototype.getNodesToUpdate = function(analysis, callback) {
    var self = this;

    var sortedNodes = analysis.getSortedNodes();
    var sortedNodesIds = sortedNodes.map(function(node) {
        return node.cachedNodeId();
    });

    var nodesById = {};
    analysis.getNodes().forEach(function(node) {
        setCacheQueryTimeoutFromLimits(node, self.limits);
        if (!nodesById.hasOwnProperty(node.cachedNodeId())) {
            nodesById[node.cachedNodeId()] = [];
        }
        nodesById[node.cachedNodeId()].push(node);
    });

    var query = [
        'SELECT node_id, updated_at, status, last_error_message',
        'FROM cdb_analysis_catalog',
        'WHERE node_id IN (',
        sortedNodesIds
            .filter(function(node) { return node.type !== Source.TYPE; })
            .map(queries.pgQuoteCastMapper()),
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

        return callback(null, nodesToQueueForUpdate);
    });
};

function setCacheQueryTimeoutFromLimits(node, limits) {
    var typeLimit = limits.analyses[node.getType()];
    if (typeLimit && Number.isFinite(typeLimit.timeout)) {
        debug('Type %s set with query timeout=%d', node.getType(), typeLimit.timeout);
        return node.setCacheQueryTimeout(typeLimit.timeout);
    }
    node.getTags().some(function(tag) {
        var tagLimit = limits.analyses[tag];
        if (tagLimit && Number.isFinite(tagLimit.timeout)) {
            debug('Type %s set with tag=%s query timeout=%d', node.getType(), tag, tagLimit.timeout);
            node.setCacheQueryTimeout(tagLimit.timeout);
            return false;
        }
        return true;
    });
}

function getSourceNodes(node) {
    return node.getAllInputNodes(function (node) {
        return node.getType() === 'source';
    });
}

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
