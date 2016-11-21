'use strict';

function MockNode(id, inputNodes) {
    this._id = id;
    this._inputNodes = {};

    if (inputNodes) {
        inputNodes = Array.isArray(inputNodes) ? inputNodes : [inputNodes];

        inputNodes.forEach(function (inputNode) {
            this._inputNodes[inputNode.id()] = inputNode;
        }.bind(this));
    }
}

module.exports = MockNode;

MockNode.prototype.id = function() {
    return this._id;
};

MockNode.prototype.getInputNodes = function() {
    var inputNodes = [];

    Object.keys(this._inputNodes).forEach(function (inputNodeId) {
        inputNodes.push(this._inputNodes[inputNodeId]);
    }.bind(this));

    return inputNodes;
};

MockNode.prototype.getType = function() {
    return 'mock-node';
};

MockNode.prototype.toJSON = function() {
    return {
        id: this._id,
        inputNodes: this.getInputNodes().map(function(n) { return n.id(); })
    };
};
