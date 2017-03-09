'use strict';

var nodes = require('../node');
var Node = require('../node/node');
var async = require('async');
var debug = require('../util/debug')('factory');

var typeNodeMap = nodes.reduce(function(typeNodeMap, node) {
    typeNodeMap[node.TYPE] = node;
    return typeNodeMap;
}, {});

function Factory(user, databaseService) {
    this.user = user;
    this.databaseService = databaseService;
    this.typeNodeMap = typeNodeMap;
    this.createdTableNodes = {};
}

module.exports = Factory;

/**
 * Create DAG for analysis definition
 *
 * @param {Object} definition As specified in camshaft-reference.
 * @param {Function} callback function(err, rootNode)
 */
Factory.prototype.create = function (definition, callback) {
    this._create(definition, 0, callback);
};

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
 * @param {Number|Function} depth
 * @param {Function} callback
 */
Factory.prototype._create = function (definition, depth, callback) {
    debug('create', definition);
    if (!this._supportsType(definition.type)) {
        return callback(new Error('Unknown analysis type: "' + definition.type + '"'));
    }

    var self = this;

    definition.params.id = definition.id;

    var NodeClass = self.getNodeClass(definition.type);

    var childNodesNames = Node.getChildNodesNames(NodeClass);
    var childNodesDefinitions = childNodesNames.reduce(function(childNodesDefinitions, childNodeName) {
        if (definition.params.hasOwnProperty(childNodeName)) {
            childNodesDefinitions.push(definition.params[childNodeName]);
        }
        return childNodesDefinitions;
    }, []);

    depth += 1;
    function create(definition, callback) {
        self._create(definition, depth, callback);
    }

    async.mapSeries(childNodesDefinitions, create, function(err, results) {
        if (err) {
            return callback(err);
        }

        childNodesNames.forEach(function(childNodesName, index) {
            definition.params[childNodesName] = results[index];
        });

        var node;
        try {
            node = new NodeClass(self.user, definition.params);
        } catch (err) {
            err.node_id = definition.id;
            return callback(err);
        }

        var skipUpdate = depth === 1;
        self.databaseService.getLastUpdatedTimeFromAffectedTables(node, skipUpdate, 
        function(err, lastUpdatedAt, affectedTables) {
            if (err) {
                return callback(err);
            }
            node.setUpdatedAt(lastUpdatedAt);
            node.addAffectedTables(affectedTables);

            self.databaseService.getColumns(node.sql(), function(err, columns) {
                if (err) {
                    return callback(err);
                }
                node.setColumns(columns);

                if (node.shouldCacheQuery() && !self.createdTableNodes[node.id()]) {
                    self.createdTableNodes[node.id()] = true;
                    self.databaseService.createTableIfNotExists(node.getTargetTable(), node.sql(), function(err) {
                        if (err) {
                            return callback(err);
                        }
                        return callback(null, node);
                    });
                } else {
                    return callback(null, node);
                }
            });
        });
    });
};

Factory.prototype._supportsType = function(nodeType) {
    return this.typeNodeMap.hasOwnProperty(nodeType);
};

Factory.prototype.getNodeClass = function(nodeType) {
    return this.typeNodeMap[nodeType];
};
