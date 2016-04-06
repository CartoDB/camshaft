'use strict';

function Route(originNode, destinationNode, kind) {
    this.originNode = originNode;
    this.destinationNode = destinationNode;
    this.kind = kind; // 'fastest', 'cheapest'
}

module.exports = Route;