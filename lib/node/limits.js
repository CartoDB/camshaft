// Functions to apply limits to nodes

'use strict';

var nodeError = require('../limits/error');
var estimates = require('../limits/estimates');

function limitNumberOfRows(node, context, limit, callback) {
    if (!Number.isFinite(limit.value)) {
        return callback(null);
    }
    estimates.estimatedNumberOfRows(node, context, function(err, outputRows) {
        if (err) {
            // if estimation is not available don't abort the analysis
            context.logError(err);
            err = null;
        } else {
            if (outputRows > limit.value) {
                err = nodeError(node, [limit.message]);
            }
        }
        return callback(err);
    });
}

function limitInputRows(node, input, context, limit, callback) {
    if (!Number.isFinite(limit.value)) {
        return callback(null);
    }
    estimates.estimatedNumberOfRows(node[input], context, function(err, numRows) {
        if (err) {
            context.logError(err);
            err = null;
        } else {
            if (numRows > limit.value) {
                err = nodeError(node, [limit.message]);
            }
        }
        return callback(err);
    });
}

function limitInputRowsAndAvgGroupedRows(node, input, column, context, lims, callback) {
    var limit = lims.rowsLimit;
    var groupedLimit = lims.groupedRowsLimit;
    var limitPresent = Number.isFinite(limit.value);
    var groupedLimitPresent = Number.isFinite(groupedLimit.value);
    if (!limitPresent && !groupedLimitPresent) {
        return callback(null);
    }

    function check(inputRows, numCategories) {
        var numberOfRowsPerCategory = inputRows/(numCategories || 1);
        var messages = [];
        if (limitPresent && inputRows > limit.value) {
            messages.push(limit.message);
        }
        if (groupedLimitPresent && numberOfRowsPerCategory > groupedLimit.value) {
            messages.push(groupedLimit.message);
        }
        return callback(nodeError(node, messages));
    }

    estimates.estimatedNumberOfRows(node[input], context, function(err, inputRows) {
        if (err) {
            context.logError(err);
            // something went wrong... lack of stats? anyway, we'll let the analysis pass
            return callback(null);
        } else {
            var numCategories = 1;
            if (column && groupedLimitPresent) {
                estimates.numberOfDistinctValues(
                    node[input], context, column,
                    function(err, num) {
                        if (err) {
                            context.logError(err);
                        } else {
                            numCategories = num;
                        }
                        check(inputRows, numCategories);
                    }
                );
             }
             else {
               check(inputRows.source, numCategories);
             }
        }
    });
}

module.exports = {
    limitNumberOfRows: limitNumberOfRows,
    limitInputRows: limitInputRows,
    limitInputRowsAndAvgGroupedRows: limitInputRowsAndAvgGroupedRows
};
