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

    var NodeClass = self.getNodeClass(definition.type);

    var childNodesNames = Node.getChildNodesNames(NodeClass);
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

        var node;
        try {
            node = new NodeClass(self.user, definition.params);
        } catch (err) {
            return callback(err);
        }

        node.getAndSetUpdatedAt(self.databaseService, function(err) {
            if (err) {
                return callback(err);
            }

            self.databaseService.getColumns(node.sql(), function(err, columns) {
                if (err) {
                    return callback(err);
                }
                node.setColumns(columns);



                if (node.shouldCacheQuery()) {
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
