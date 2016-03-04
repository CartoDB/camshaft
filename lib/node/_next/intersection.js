'use strict';

var id = require('../../util/id');

var TYPE = 'intersection';

function Intersection(sourceNode, targetNode, count) {
    this.sourceNode = sourceNode;
    this.targetNode = targetNode;
    this.count = count; // 1 for nearest
}

module.exports = Intersection;
module.exports.TYPE = TYPE;

Buffer.prototype.id = function() {
    return id(this.toJSON());
};

Buffer.prototype.toJSON = function() {
    return {
        type: 'intersection',
        sourceNodeId: this.sourceNode.id(),
        targetNodeId: this.targetNode.id(),
        count: this.count
    };
};
