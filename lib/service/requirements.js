'use strict';

var async = require('async');

// A priori checking of the requirements/limits of an analysis
function Requirements(databaseService, limits) {
    this.databaseService = databaseService;
    this.limits = limits;
}

Requirements.prototype.checkLimits = function (analysis, callback) {
    var sortedNodes = analysis.getSortedNodes();
    var allNodes = analysis.getNodes();
    var aliasedNodesPresent = allNodes.length > sortedNodes.length;
    var self = this;
    async.eachSeries(
        sortedNodes,
        function(node, done) {
           node.computeRequirements(self.databaseService, self.limits, function(err) {
               if (err) {
                   return done(err);
               }
               if (aliasedNodesPresent) {
                   // some nodes are aliased (multiple nodes with the same id);
                   // we need to replicate the requirements and limits to them, because
                   // another node later in the sequence may try to access them
                   replicateRequirementsToAliases(node, allNodes);
               }
               // Validates analysis requirements, node by node individually; as soon as
               // a node fails to pass the requirements this is aborted, the node status
               // and error message stored in the cataglo, and the error is returned to
               // the callback.
               return done(node.validateRequirements());
           });
        },
        callback
    );
};

module.exports = Requirements;

function replicateRequirementsToAliases(node, allNodes) {
    var id = node.id();
    allNodes.forEach(function(otherNode) {
        if (otherNode.id() === id && !otherNode.estimatedRequirements) {
            otherNode.estimatedRequirements = node.estimatedRequirements;
            otherNode.limits = node.limits;
        }
    });
}
