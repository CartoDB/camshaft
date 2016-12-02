// Functions to apply limits to nodes

'use strict';

var async = require('async');
var nodeError = require('../limits/error');
var estimates = require('../limits/estimates');

// Obtain limit values given the limit definitions, which has the form:
//   {  maximumNumberOfRows: {          // name of the limit argument as used by checker functions
//          default: 1000000,           // limit default value
//          message: 'too many rows'    // error to be shown when limit is exceeded
//          name: 'maximumNumberOfRows' // (optional) name of the limit configuration parameter
//          ...
// The result if of the form:
//   {  maximumNumberOfRows: {          // name of the limit argument as used by checker functions
//          value: 1000000,             // value of the limit
//          message: 'too many rows'    // error to be shown when limit is exceeded
//          ...
function limitValues(node, context, limits, callback) {
    var values = {};
    Object.keys(limits).forEach(function(limit) {
        var limitParams = limits[limit];
        var limitName = limit || limitParams.name;
        var limitValue = context.getLimit(node, limitName, limitParams.default, limitParams.message);
        values[limit] = limitValue;
    });
    callback(null, values);
}

// Execute single limit checker.
// limits defines the limits to use and is of the form accepted by `limitValues`
function applyCheck(node, context, checker, limits, params, callback) {
    if (!checker) {
        return callback(null);
    }
    async.waterfall(
        [
            function check$limitValues(done) {
                // Get the limit values from the limits definitions
                limitValues(node, context, limits, done);
            },
            function check$apply(limits, done) {
                // Call the checker function passing the limit values
                checker(node, context, limits, params, done);
            }
        ],
        callback
    );
}

// Execute multiple limit checkers, given an array of checker definitions; each checker definition is of the form:
//    {
//        checker: function(node, context, limitValues, params, callback) // checker function
//        limits:  { lim1:  { ... } }     // limit definitions as accepted by `limitValues`
//        params: { param1: value1, ... } // parameters passed to the checker
//    }
function check(node, context, checkerDefinitions, callback) {
    async.eachSeries(checkerDefinitions, function(checkerDefinition, done) {
        var params = checkerDefinition.params || {};
        var limits = checkerDefinition.limits || {};
        applyCheck(node, context, checkerDefinition.checker, limits, params, done);
    }, callback);
}

function limitNumberOfRows(node, context, limits, _params, callback) {
    var limit = limits.maximumNumberOfRows;
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

function limitInputRows(node, context, limits, params, callback) {
    var limit = limits.maximumNumberOfRows;
    var input = params.input;
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

function limitInputRowsAndAvgGroupedRows(node, context, limits, params, callback) {
    var limit = limits.rowsLimit;
    var groupedLimit = limits.groupedRowsLimit;
    var input = params.input;
    var column = params.column;
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
               check(inputRows, numCategories);
             }
        }
    });
}

module.exports = {
    check: check,
    // basic limit checker functions
    limitNumberOfRows: limitNumberOfRows,
    limitInputRows: limitInputRows,
    limitInputRowsAndAvgGroupedRows: limitInputRowsAndAvgGroupedRows
};
