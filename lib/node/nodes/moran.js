'use strict';

var Node = require('../node');

var moranQueryTemplate = Node.getSqlTemplateFn('moran');

var TYPE = 'moran';
var PARAMS = {
    source: Node.PARAM.NODE,
    numerator_column: Node.PARAM.STRING,
    denominator_column: Node.PARAM.STRING,
    significance: Node.PARAM.NUMBER,
    neighbours: Node.PARAM.NUMBER,
    permutations: Node.PARAM.NUMBER,
    w_type: Node.PARAM.ENUM('knn', 'queen')
};

var Moran = Node.create(TYPE, PARAMS, { cache: true });

module.exports = Moran;
module.exports.TYPE = TYPE;
module.exports.PARAMS = PARAMS;

Moran.prototype.sql = function() {

    console.log(moranQueryTemplate({
        _query: this.source.getQuery(),
        _numeratorColumn: this.numerator_column,
        _denominatorColumn: this.denominator_column,
        _significance: this.significance,
        _neighbours: this.neighbours,
        _permutations: this.permutations,
        _wType: this.w_type
    }));

    return moranQueryTemplate({
        _query: this.source.getQuery(),
        _numeratorColumn: this.numerator_column,
        _denominatorColumn: this.denominator_column,
        _significance: this.significance,
        _neighbours: this.neighbours,
        _permutations: this.permutations,
        _wType: this.w_type
    });
};
