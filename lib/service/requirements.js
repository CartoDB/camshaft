'use strict';

var async = require('async');
var Node = require('../node/node');
var debug = require('../util/debug')('requirements');

var QUERY_RUNNER_READONLY_OP = true;
var QUERY_RUNNER_WRITE_OP = !QUERY_RUNNER_READONLY_OP;

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
};

// Validates analysis requirements, node by node individually; as soon as
// a node fails to pass the requirements this is aborted, the node status
// and error message stored in the cataglo, and the error is returned to
// the callback.
Requirements.prototype.validateRequirements = function (analysis, callback) {
    var self = this;
    async.eachSeries(
        analysis.getSortedNodes(),
        function(node, done) {
           node.validateRequirements(function(err) {
             if (err) {
                 // register the failed status
                 var sql = updateNodeAsFailedAtAnalysisCatalogQuery([node.id()], err.message);
                 self.databaseService.queryRunner.run(sql, QUERY_RUNNER_WRITE_OP, function(sql_err) {
                     if (sql_err) {
                         // FiXME: what should we do if saving the status fails?
                         debug('SQL ERROR:', sql_err);
                     }
                     return done(err);
                 });
             } else {
               return done(err);
             }
           });
        },
        callback
    );
};

module.exports = Requirements;

function pgQuoteCastMapper(cast) {
    return function(input) {
        return '\'' + input + '\'' + (cast ? ('::' + cast) : '');
    };
}

function updateNodeAtAnalysisCatalogQuery(nodeIds, columns) {
    nodeIds = Array.isArray(nodeIds) ? nodeIds : [nodeIds];
    return [
        'UPDATE cdb_analysis_catalog SET',
        columns.join(','),
        'WHERE node_id IN (' + nodeIds.map(pgQuoteCastMapper()).join(', ') + ')'
    ].join('\n');
}

function updateNodeAsFailedAtAnalysisCatalogQuery(nodeIds, errorMessage) {
    var status = Node.STATUS.FAILED;
    return updateNodeAtAnalysisCatalogQuery(nodeIds, [
        'status = \'' + status + '\'',
        'last_error_message = $last_error_message$' + errorMessage + '$last_error_message$',
        'updated_at = NOW()'
    ]);
}
