'use strict';

var version = require('./version');

function AnalysisGraph(definition, wantedVersion) {
    wantedVersion = wantedVersion || 'latest';

    this.definition = definition;
    this.reference = version.getVersion(wantedVersion);
}

module.exports = AnalysisGraph;

AnalysisGraph.prototype.getNodesWithId = function() {
    return reduceById({}, this.definition, this.reference);
};

AnalysisGraph.prototype.getNodesList = function() {
    return appendAllNodes([], this.definition, this.reference);
};

AnalysisGraph.prototype.getDefinitionWith = function(nodeId, extendedWithParams) {
    return extendDefinition(this.definition, this.reference, nodeId, extendedWithParams);
};

function extendDefinition(definition, reference, nodeId, extendedWithParams) {
    if (definition.id && definition.id === nodeId) {
        Object.keys(extendedWithParams).forEach(function(extendWithParamsKey) {
            definition.params[extendWithParamsKey] = extendedWithParams[extendWithParamsKey];
        });
    }

    childNodes(definition.type, reference).forEach(function(childNodeParamName) {
        extendDefinition(definition.params[childNodeParamName], reference, nodeId, extendedWithParams);
    });

    return definition;
}

function appendAllNodes(allNodes, definition, reference) {
    allNodes.push(definition);

    childNodes(definition.type, reference).forEach(function(childNodeParamName) {
        appendAllNodes(allNodes, definition.params[childNodeParamName], reference);
    });
    return allNodes;
}

function reduceById(nodesMap, definition, reference) {
    if (definition.id) {
        nodesMap[definition.id] = definition;
    }
    childNodes(definition.type, reference).forEach(function(childNodeParamName) {
        reduceById(nodesMap, definition.params[childNodeParamName], reference);
    });
    return nodesMap;
}

function childNodes(nodeType, reference) {
    var nodeRef = reference.analyses[nodeType];

    return Object.keys(nodeRef.params).reduce(function(childNodesNames, paramName) {
        if (nodeRef.params[paramName].type === 'node') {
            childNodesNames.push(paramName);
        }
        return childNodesNames;
    }, []);
}
