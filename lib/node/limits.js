// Functions to apply limits to nodes

'use strict';

var nodeError = require('../limits/error');
var estimates = require('../limits/estimates');

function limitNumberOfRows (node, context, limit, callback) {
    const { logger } = context;
    if (!Number.isFinite(limit.value)) {
        const err = new Error('Limit for number of rows is not defined');
        err.node = { id: node.id(), user: node.getOwner(), type: node.getType(), status: node.getStatus(), updatedAt: node.getUpdatedAt() };
        logger.warn({ exception: err }, err.message);
        return callback(null);
    }
    estimates.estimatedNumberOfRows(node, context, function (err, outputRows) {
        if (err) {
            // if estimation is not available don't abort the analysis
            err.node = { id: node.id(), user: node.getOwner(), type: node.getType(), status: node.getStatus(), updatedAt: node.getUpdatedAt() };
            logger.warn({ exception: err }, 'Number of rows estimation not available');
            err = null;
        } else {
            if (outputRows > limit.value) {
                err = nodeError(node, [limit.message]);
            }
        }
        return callback(err);
    });
}

function limitInputRows (node, input, context, limit, callback) {
    const { logger } = context;

    if (!Number.isFinite(limit.value)) {
        const err = new Error('Limit for input rows is not defined');
        err.node = { id: node.id(), user: node.getOwner(), type: node.getType(), status: node.getStatus(), updatedAt: node.getUpdatedAt() };
        logger.warn({ exception: err }, err.message);
        return callback(null);
    }
    estimates.estimatedNumberOfRows(node[input], context, function (err, numRows) {
        if (err) {
            err.node = { id: node.id(), user: node.getOwner(), type: node.getType(), status: node.getStatus(), updatedAt: node.getUpdatedAt() };
            logger.warn({ exception: err }, 'Number of rows estimation not available');
            err = null;
        } else {
            if (numRows > limit.value) {
                err = nodeError(node, [limit.message]);
            }
        }
        return callback(err);
    });
}

function limitInputRowsAndAvgGroupedRows (node, input, categoriesData, context, lims, callback) {
    const { logger } = context;
    var limit = lims.rowsLimit;
    var groupedLimit = lims.groupedRowsLimit;
    var limitPresent = Number.isFinite(limit.value);
    var groupedLimitPresent = Number.isFinite(groupedLimit.value);
    if (!limitPresent && !groupedLimitPresent) {
        const err = new Error('limitInputRowsAndAvgGroupedRows called without any passed limit');
        err.node = { id: node.id(), user: node.getOwner(), type: node.getType(), status: node.getStatus(), updatedAt: node.getUpdatedAt() };
        logger.warn({ exception: err }, err.message);
        return callback(null);
    } else if (groupedLimitPresent && !_verifyCategoryData(categoriesData)) {
        const err = new Error('Categories data must contain source and column name keys');
        err.node = { id: node.id(), user: node.getOwner(), type: node.getType(), status: node.getStatus(), updatedAt: node.getUpdatedAt() };
        logger.warn({ exception: err }, err.message);
        return callback(null);
    }

    function check (inputRows, numCategories) {
        var numberOfRowsPerCategory = inputRows / (numCategories || 1);
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

function limitInputRowsMultipliedByCategories (node, input, categoryTarget, context, limit, callback) {
    const { logger } = context;
    var limitPresent = Number.isFinite(limit.value);
    if (!limitPresent) {
        const err = new Error('Limit for input rows multiplied by categories is not defined');
        err.node = { id: node.id(), user: node.getOwner(), type: node.getType(), status: node.getStatus(), updatedAt: node.getUpdatedAt() };
        logger.warn({ exception: err }, err.message);
        return callback(null);
    } else if (!_verifyCategoryData(categoryTarget)) {
        const err = new Error('Categories data must contain source and column name keys');
        err.node = { id: node.id(), user: node.getOwner(), type: node.getType(), status: node.getStatus(), updatedAt: node.getUpdatedAt() };
        logger.warn({ exception: err }, err.message);
        return callback(null);
    }

    function check (inputRows, numCategories) {
        var maxNumberOfPossibleRows = inputRows * numCategories || 1;
        var messages = [];
        if (limitPresent && maxNumberOfPossibleRows > limit.value) {
            messages.push(limit.message);
        }
        return callback(nodeError(node, messages));
    }

    _limitInputRowsWithCategories(node, input, categoryTarget, context, check, callback);
}

function _limitInputRowsWithCategories (node, input, categoryTarget, context, checkFunction, callback) {
    const { logger } = context;
    estimates.estimatedNumberOfRows(node[input], context, function (err, inputRows) {
        if (err) {
            // something went wrong... lack of stats? anyway, we'll let the analysis pass
            err.node = { id: node.id(), user: node.getOwner(), type: node.getType(), status: node.getStatus(), updatedAt: node.getUpdatedAt() };
            logger.warn({ exception: err }, 'Number of rows estimation not available');
            return callback(null);
        } else {
            var numCategories = 1;
            if (categoryTarget.column) {
                estimates.numberOfDistinctValues(
                    node[categoryTarget.source], context, categoryTarget.column,
                    function (err, num) {
                        if (err) {
                            err.node = { id: node.id(), user: node.getOwner(), type: node.getType(), status: node.getStatus(), updatedAt: node.getUpdatedAt() };
                            logger.warn({ exception: err }, 'Number of distinct values not available');
                        } else {
                            numCategories = num;
                        }
                        checkFunction(inputRows, numCategories);
                    }
                );
            } else {
                checkFunction(inputRows, numCategories);
            }
        }
    });
}

function _verifyCategoryData (categoryTarget) {
    // Object could be empty but if not we check for required keys
    if (!categoryTarget) {
        return true;
    } else {
        return Object.prototype.hasOwnProperty.call(categoryTarget, 'source') && Object.prototype.hasOwnProperty.call(categoryTarget, 'column');
    }
}

module.exports = {
    limitNumberOfRows: limitNumberOfRows,
    limitInputRows: limitInputRows,
    limitInputRowsAndAvgGroupedRows: limitInputRowsAndAvgGroupedRows,
    limitInputRowsMultipliedByCategories: limitInputRowsMultipliedByCategories
};
