'use strict';

var Node = require('../node');

var TYPE = 'moran';
var PARAMS = {
    numerator_column: Node.PARAM_TYPE.TEXT,
    denominator_column: Node.PARAM_TYPE.TEXT,
    significance: Node.PARAM_TYPE.NUMERIC,
    neighbours: Node.PARAM_TYPE.NUMERIC,
    permutations: Node.PARAM_TYPE.NUMERIC,
    w_type: Node.PARAM_TYPE.ENUM('knn', 'queen')
};

var Moran = Node.create(TYPE, PARAMS);

module.exports = Moran;
module.exports.TYPE = TYPE;
module.exports.PARAMS = PARAMS;
module.exports.create = require('./factory').create;

// ------------------------------ PUBLIC API ------------------------------ //

Moran.prototype.getQuery = function() {
    return 'select * from ' + this.getTargetTable();
};

// ---------------------------- END PUBLIC API ---------------------------- //

Moran.prototype.getTargetTable = function() {
    return 'analysis_cdb_moran_' + this.id();
};
