'use strict';

var nodes = require('../node');

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
 * @param {Object} definition
 * @param {Function} callback
 */
Factory.prototype.create = function (definition, callback) {
    if (!this._supportsType(definition.type)) {
        return callback(new Error('Unknown analysis type: "' + definition.type + '"'));
    }

    var Node = this.getNodeClass(definition.type);
    Node.create(definition, this, this.databaseService, function (err, node) {
        try {
            // callback might create nodes based on `node`, if it throws we should call callback again
            // TODO Not the best approach, but fair enough for now
            return callback(err, node);
        } catch (err) {
            return callback(err);
        }
    });
};

Factory.prototype._supportsType = function(nodeType) {
    return this.typeNodeMap[nodeType];
};

Factory.prototype.getNodeClass = function(nodeType) {
    return this.typeNodeMap[nodeType];
};
