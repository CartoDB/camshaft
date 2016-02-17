'use strict';

var NotImplemented = require('../error/not-implemented');

function Node() {

}

module.exports = Node;

Node.prototype.id = function() {
    throw new NotImplemented();
};

Node.prototype.getQuery = function() {
    throw new NotImplemented();
};

Node.prototype.getInputNodes = function() {
    throw new NotImplemented();
};

Node.prototype.getCacheTables = function() {
    return [];
};

Node.prototype.getAffectedTables = function() {
    return [];
};

Node.prototype.toJSON = function() {
    throw new NotImplemented();
};

Node.prototype.toDot = function() {
    throw new NotImplemented();
};
