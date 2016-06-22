'use strict';

var debug = require('../util/debug')('toposort');

function toposort(rootNode) {
    var edges = buildEdges(rootNode);
    debug('Found %d edges: %j', edges.length, edges.map(function(edge) {
        return [edge[0].id(), edge[1].id()];
    }));
    if (edges.length === 0) {
        return [rootNode];
    }
    return sort(edges);
}

module.exports = toposort;

function sort(edges) {
    return depthFirst(uniqueNodes(edges), edges);
}

function buildEdges(node, edges) {
    edges = edges || [];

    node.getInputNodes().forEach(function(inputNode) {
        edges.push([inputNode, node]);
        debug('%s => %s', inputNode.id(), node.id());

        buildEdges(inputNode, edges);
    });

    return edges;
}

function uniqueNodes(edges) {
    return edges.reduce(function(uniq, edge) {
        uniq[edge[0].id()] = edge[0];
        uniq[edge[1].id()] = edge[1];
        return uniq;
    }, {});
}

// See https://en.wikipedia.org/wiki/Topological_sorting#Depth-first_search
function depthFirst(uniqNodes, edges) {
    var nodeIds = Object.keys(uniqNodes);
    var totalNodes = nodeIds.length;
    debug('Found %d unique nodes: %j', totalNodes, nodeIds);

    var sortedNodes = [];
    var markedNodes = {};

    while (totalNodes--) {
        var currentNode = uniqNodes[nodeIds[totalNodes]];

        if (!markedNodes[currentNode.id()]) {
            visit(currentNode, edges, markedNodes, sortedNodes);
        }
    }

    return sortedNodes;
}

function visit(node, allEdges, markedNodes, sortedNodes, parents) {
    parents = parents || {};

    debug('Visiting node=%s', node.id());

    if (parents.hasOwnProperty(node.id())) {
        throw new Error('Cycle at node: ' + JSON.stringify(node.toJSON()));
    }

    if (markedNodes[node.id()]) {
        return true;
    }

    markedNodes[node.id()] = true;

    var outgoingEdges = allEdges.filter(function(edge) {
        return edge[0].id() === node.id();
    });

    if (outgoingEdges.length) {
        parents[node.id()] = true;

        outgoingEdges.forEach(function(outgoingEdge) {
            visit(outgoingEdge[1], allEdges, markedNodes, sortedNodes, parents);
        });
    }

    sortedNodes.unshift(node);
}
