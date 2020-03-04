// Function to check the limits of an analysis

'use strict';

var async = require('async');

module.exports = function (analysis, context, callback) {
    var sortedNodes = analysis.getSortedNodes();
    async.eachSeries(
        sortedNodes,
        function (node, done) {
            node.checkLimits(context, function (err) {
                // Validates analysis requirements, node by node individually; as soon as
                // a node fails to pass the requirements this is aborted and the error is returned to
                // the callback.
                if (err) {
                    err.node_id = node.params ? node.params.id : undefined;
                }
                return done(err);
            });
        },
        // callback
        function (err) {
            return callback(err);
        }
    );
};
