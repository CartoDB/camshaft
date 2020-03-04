'use strict';

function MockNode (id, inputNodes) {
    this._id = id;
    this._inputNodes = [];

    if (inputNodes) {
        this._inputNodes = Array.isArray(inputNodes) ? inputNodes : [inputNodes];
    }
}

module.exports = MockNode;

MockNode.prototype.id = function () {
    return this._id;
};

MockNode.prototype.getInputNodes = function () {
    return this._inputNodes;
};

MockNode.prototype.getType = function () {
    return 'mock-node';
};

MockNode.prototype.toJSON = function () {
    return {
        id: this._id,
        inputNodes: this._inputNodes.map(function (n) { return n.id(); })
    };
};
