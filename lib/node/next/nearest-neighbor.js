'use strict';

function NearestNeighbor(sourceNode, targetNode, count) {
    this.sourceNode = sourceNode;
    this.targetNode = targetNode;
    this.count = count; // 1 for nearest
}

module.exports = NearestNeighbor;
