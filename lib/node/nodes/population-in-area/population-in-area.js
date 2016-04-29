'use strict';

var Node = require('../../node');
var buildQuery = require('./population-in-area-query-builder');

var TYPE = 'population-in-area';
var PARAMS = {
    source: Node.PARAM.NODE,
    final_column: Node.PARAM.STRING
};

var PopulationInArea = Node.create(TYPE, PARAMS, { cache: true });

module.exports = PopulationInArea;
module.exports.TYPE = TYPE;
module.exports.PARAMS = PARAMS;

PopulationInArea.prototype.sql = function() {
    return buildQuery({
        source: this.source.getQuery(),
        columns: this.source.getColumns(),
        final_column: this.final_column
    });

};
