'use strict';

var async = require('async');

// A priori checking of the requirements/limits of an analysis
function Requirements(databaseService, limits) {
    this.databaseService = databaseService;
    this.limits = limits;
}

Requirements.prototype.checkLimits = function (analysis, callback) {
    var sortedNodes = analysis.getSortedNodes();
    var self = this;
    async.eachSeries(
        sortedNodes,
        function(node, done) {
           node.checkLimits(self.databaseService, self.limits, function(err) {
               // Validates analysis requirements, node by node individually; as soon as
               // a node fails to pass the requirements this is aborted and the error is returned to
               // the callback.
               if (err) {
                   err.node_id = node.params ? node.params.id : undefined;
               }
               return done(err);
           });
        },
        callback
    );
};

module.exports = Requirements;
