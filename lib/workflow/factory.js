'use strict';

var nodes = require('../node');
var AnalysisGraph = require('../../reference/analysis-graph');
var async = require('async');
var debug = require('../util/debug')('factory');

var typeNodeMap = Object.keys(nodes).reduce(function(typeNodeMap, modelName) {
    typeNodeMap[nodes[modelName].TYPE] = nodes[modelName];
    return typeNodeMap;
}, {});

function Factory(databaseService) {
    this.databaseService = databaseService;
    this.typeNodeMap = typeNodeMap;
}

module.exports = Factory;

/**
 * This should create and validate nodes before calling callback back.
 * That includes includes creating intermediate tables for async analysis operations.
 *
 * DAG node creation
 * 1. Extract param names for child nodes
 * 2. Create nodes, for each:
 *  2.1. Go to 1.
 *  2.2. Retrieve column names
 *  2.3. Register operations to be queued in batch sql api
 *
 * @param {Object} definition
 * @param {Function} callback
 */
Factory.prototype.create = function (definition, callback) {
    debug('create', definition);
    if (!this._supportsType(definition.type)) {
        return callback(new Error('Unknown analysis type: "' + definition.type + '"'));
    }

    var self = this;

    definition.params.id = definition.id;
    var graph = new AnalysisGraph(definition);
    var childNodesNames = graph.getChildNodesNames();
    var childNodesDefinitions = childNodesNames.map(function(childNodeName) {
        return definition.params[childNodeName];
    });

    async.map(childNodesDefinitions, this.create.bind(this), function(err, results) {
        if (err) {
            return callback(err);
        }

        childNodesNames.forEach(function(childNodesName, index) {
            definition.params[childNodesName] = results[index];
        });

        var NodeClass = self.getNodeClass(definition.type);
        var node;
        try {
            node = new NodeClass(definition.params);
        } catch (err) {
            return callback(err);
        }
        self.databaseService.getColumnNames(node.sql(), function(err, columnNames) {
            if (err) {
                return callback(err);
            }
            node.setColumns(columnNames);

            debug('[%s] should cache query: %s', node.type, node.cacheQuery);

            if (node.shouldCacheQuery()) {
                var targetTableName = node.getTargetTable();

                self.databaseService.tableExists(targetTableName, function(err, tableExists) {
                    if (tableExists) {
                        return callback(null, node);
                    }

                    var outputQuery = node.sql();
                    self.databaseService.createTable(targetTableName, outputQuery, function(err) {
                        if (err) {
                            return callback(null, node);
                        }
                        var populateQuery = populateCacheTableQuery(targetTableName, outputQuery);
                        self.databaseService.enqueue(populateQuery, function() {
                            return callback(null, node);
                        });
                    });
                });
            } else {
                return callback(null, node);
            }
        });
    });
};

function populateCacheTableQuery(targetTableName, outputQuery) {
    return 'INSERT INTO ' + targetTableName + ' ' + outputQuery;
}

Factory.prototype._supportsType = function(nodeType) {
    return this.typeNodeMap.hasOwnProperty(nodeType);
};

Factory.prototype.getNodeClass = function(nodeType) {
    return this.typeNodeMap[nodeType];
};
