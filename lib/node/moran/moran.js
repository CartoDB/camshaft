'use strict';

var Node = require('../node');

var TYPE = 'moran';
var PARAMS = {
    numerator_column: Node.PARAM.STRING,
    denominator_column: Node.PARAM.STRING,
    significance: Node.PARAM.NUMBER,
    neighbours: Node.PARAM.NUMBER,
    permutations: Node.PARAM.NUMBER,
    w_type: Node.PARAM.ENUM('knn', 'queen')
};

var Moran = Node.create(TYPE, PARAMS);

module.exports = Moran;
module.exports.TYPE = TYPE;
module.exports.PARAMS = PARAMS;
module.exports.create = require('./factory').create;

// ------------------------------ PUBLIC API ------------------------------ //

Moran.prototype._getQuery = function() {
    return 'select * from ' + this.getTargetTable();
};

// ---------------------------- END PUBLIC API ---------------------------- //

Moran.prototype.getTargetTable = function() {
    return 'analysis_cdb_moran_' + this.id();
};
