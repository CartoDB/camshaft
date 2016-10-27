var async = require('async');

// A priori checking of the requirements/limits of an analysis
function Requirements(databaseService, limits) {
    this.databaseService = databaseService;
    this.limits = limits;
}

// TODO: consider doing computation & validation in one single process
Requirements.prototype.computeRequirements = function (analysis, callback) {
    var self = this;
    async.eachSeries(
        analysis.getSortedNodes(),
        function(node, done) {
           node.computeRequirements(self.databaseService, self.limits, done);
        },
        function finish(err) {
            if (err) {
                return callback(err);
            }
            return callback(null);
        }
    );
}

Requirements.prototype.validateRequirements = function (analysis, callback) {
    // TODO: use databaseService to set state of invalid nodes to fail (& error message)
    // Note that this stops as soon as a node is not valid, so we'll get the error of the first
    // failing node.
    // question: does eachSeries abort at first  error? should we? yes, we should save first fail status and abort
    var self = this;
    async.eachSeries(
        analysis.getSortedNodes(),
        function(node, done) {
           node.validateRequirements(done);
        },
        function finish(err) {
            if (err) {
                return callback(err);
            }
            return callback(null);
        }
    );
}

module.exports = Requirements;
