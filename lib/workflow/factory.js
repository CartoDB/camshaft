'use strict';

var nodes = require('../node');
var Node = require('../node/node');
var async = require('async');
var debug = require('../util/debug')('factory');

var DEFAULT_TYPE_NODE_MAP = nodes.reduce(function (typeNodeMap, node) {
    typeNodeMap[node.TYPE] = node;
    return typeNodeMap;
}, {});

function Factory (user, databaseService, typeNodeMap) {
    this.user = user;
    this.databaseService = databaseService;
    this.typeNodeMap = typeNodeMap || DEFAULT_TYPE_NODE_MAP;
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
    var wrapError = createErrorWrapper(definition);

    if (!this._supportsType(definition.type)) {
        return callback(wrapError(new Error('Unknown analysis type: "' + definition.type + '"')));
    }

    var self = this;

    definition.params.id = definition.id;

    var NodeClass = self.getNodeClass(definition.type);

    var childNodesNames = Node.getChildNodesNames(NodeClass);
    var childNodesDefinitions = childNodesNames.reduce(function (childNodesDefinitions, childNodeName) {
        if (Object.prototype.hasOwnProperty.call(definition.params, childNodeName)) {
            childNodesDefinitions.push(definition.params[childNodeName]);
        }
        return childNodesDefinitions;
    }, []);

    depth += 1;
    function create (definition, callback) {
        self._create(definition, depth, callback);
    }

    async.mapSeries(childNodesDefinitions, create, function (err, results) {
        if (err) {
            return callback(wrapError(err));
        }

        childNodesNames.forEach(function (childNodesName, index) {
            definition.params[childNodesName] = results[index];
        });

        var node;
        try {
            node = new NodeClass(self.user, definition.params);
        } catch (err) {
            return callback(wrapError(err));
        }

        var skipUpdate = depth === 1;
        self.databaseService.getMetadataFromAffectedTables(node, skipUpdate,
            function (err, data) {
                if (err) {
                    return callback(wrapError(err));
                }
                node.setUpdatedAt(data.last_update);
                var affectedTables = data.affected_tables.map(function (table) {
                    return table.schema + '.' + table.table;
                });
                node.addAffectedTables(affectedTables);

                node.beforeCreateAsync(self.databaseService, function (err) {
                    if (err) {
                        return callback(wrapError(err));
                    }
                    self.databaseService.createCacheTable(node, function (err) {
                        if (err) {
                            return callback(wrapError(err));
                        }
                        self.databaseService.getColumns(node, function (err, columns) {
                            if (err) {
                                return callback(wrapError(err));
                            }
                            node.setColumns(columns);
                            var errors = [];
                            var isValid = node.isValid(errors);
                            if (!isValid) {
                                var errorMessage = 'Validation failed: ' + errors.map(function (e) {
                                    return e.message;
                                }).join('; ') + '.';
                                return callback(wrapError(new Error(errorMessage)));
                            }
                            return callback(null, node);
                        });
                    });
                });
            });
    });
};

function createErrorWrapper (definition) {
    return function (err) {
        if (!err.node_id) {
            err.node_id = definition.id;
        }
        return err;
    };
}

Factory.prototype._supportsType = function (nodeType) {
    return Object.prototype.hasOwnProperty.call(this.typeNodeMap, nodeType);
};

Factory.prototype.getNodeClass = function (nodeType) {
    return this.typeNodeMap[nodeType];
};
