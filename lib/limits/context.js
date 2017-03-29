
'use strict';

// Context to manage dependencies needed for checking limits of analyses.
// The needed dependencies are:
// * A DatabaseService object (with a method run to execute SQL queries).
// * A global limits object holding the limits configuration.
// * A logger object used to log information about errors.
function LimitsContext(databaseService, limits, logger) {
    this.databaseService = databaseService;
    this.limits = limits || {};
    this.logger = logger;
}

// Log analysis limits error information
LimitsContext.prototype.logError = function(err) {
    if (this.logger) {
        this.logger.logLimitsError(err);
    }
};

// Execute SQL in the database
LimitsContext.prototype.runSQL = function(sql, callback) {
  this.databaseService.run(sql, callback);
};

// Obtain the value of a limit, return it as an object with two attributes:
// * value: the limit value
// * message: error message to be used when the limit is exceeded
// Input parameters:
// * nodeType is the type of the node for which the limit will apply
// * limitName is the limit parameter name (as used in globalLimits)
// * defaultValue is the value used if the limit is not defined in globalLimits
// * errorMessage used when the limit is exceeded
LimitsContext.prototype.getLimit = function (nodeType, limitName, defaultValue, errorMessage) {
    var limit = null;
    var limits = this.limits.analyses;
    if (limits) {
        if (limits[nodeType] !== undefined) {
            limits = limits[nodeType];
        }
        limit = limits[limitName];
    }
    return { value: limit || defaultValue, message: errorMessage };
};

module.exports = LimitsContext;
