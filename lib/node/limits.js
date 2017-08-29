// Functions to apply limits to nodes

'use strict';

var nodeError = require('../limits/error');
var estimates = require('../limits/estimates');

function limitNumberOfRows(node, context, limit, callback) {
    if (!Number.isFinite(limit.value)) {
        context.logError('Limit for number of rows is not defined');
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
        context.logError('Limit for input rows is not defined');
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

function limitInputRowsAndAvgGroupedRows(node, input, categoriesData, context, lims, callback) {
    var limit = lims.rowsLimit;
    var groupedLimit = lims.groupedRowsLimit;
    var limitPresent = Number.isFinite(limit.value);
    var groupedLimitPresent = Number.isFinite(groupedLimit.value);
    if (!limitPresent && !groupedLimitPresent) {
        context.logError('limitInputRowsAndAvgGroupedRows called without any passed limit');
        return callback(null);
    } else if (groupedLimitPresent && !_verifyCategoryData(categoriesData)) {
        context.logError('Categories data must contain source and column name keys');
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

    _limitInputRowsWithCategories(node, input, categoriesData, context, check, callback);
}

function limitInputRowsMultipliedByCategories(node, input, categoryTarget, context, limit, callback) {
    var limitPresent = Number.isFinite(limit.value);
    if (!limitPresent) {
        context.logError('Limit for input rows multiplied by categories is not defined');
        return callback(null);
    } else if (!_verifyCategoryData(categoryTarget)) {
        context.logError('Categories data must contain source and column name keys');
        return callback(null);
    }

    function check(inputRows, numCategories) {
        var maxNumberOfPossibleRows = inputRows*numCategories || 1;
        var messages = [];
        if (limitPresent && maxNumberOfPossibleRows > limit.value) {
            messages.push(limit.message);
        }
        return callback(nodeError(node, messages));
    }

    _limitInputRowsWithCategories(node, input, categoryTarget, context, check, callback);

}

function _limitInputRowsWithCategories(node, input, categoryTarget, context, checkFunction, callback) {
    estimates.estimatedNumberOfRows(node[input], context, function(err, inputRows) {
        if (err) {
            context.logError(err);
            // something went wrong... lack of stats? anyway, we'll let the analysis pass
            return callback(null);
        } else {
            var numCategories = 1;
            if (categoryTarget.column) {
                estimates.numberOfDistinctValues(
                    node[categoryTarget.source], context, categoryTarget.column,
                    function(err, num) {
                        if (err) {
                            context.logError(err);
                        } else {
                            numCategories = num;
                        }
                        checkFunction(inputRows, numCategories);
                    }
                );
             }
             else {
               checkFunction(inputRows, numCategories);
             }
        }
    });
}

function _verifyCategoryData(categoryTarget) {
    // Object could be empty but if not we check for required keys
    if (!categoryTarget) {
        return true;
    } else {
        return categoryTarget.hasOwnProperty('source') && categoryTarget.hasOwnProperty('column');
    }
}

module.exports = {
    limitNumberOfRows: limitNumberOfRows,
    limitInputRows: limitInputRows,
    limitInputRowsAndAvgGroupedRows: limitInputRowsAndAvgGroupedRows,
    limitInputRowsMultipliedByCategories: limitInputRowsMultipliedByCategories
};
