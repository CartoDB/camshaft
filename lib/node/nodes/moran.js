'use strict';

var Node = require('../node');

var moranDenominatorQueryTemplate = Node.getSqlTemplateFn('moran-denominator');
var moranQueryTemplate = Node.getSqlTemplateFn('moran');

var TYPE = 'moran';
var PARAMS = {
    source: Node.PARAM.NODE(Node.GEOMETRY.POLYGON),
    numerator_column: Node.PARAM.STRING(),
    denominator_column: Node.PARAM.NULLABLE(Node.PARAM.STRING()),
    significance: Node.PARAM.NUMBER(),
    neighbours: Node.PARAM.NULLABLE(Node.PARAM.NUMBER()),
    permutations: Node.PARAM.NULLABLE(Node.PARAM.NUMBER()),
    w_type: Node.PARAM.NULLABLE(Node.PARAM.ENUM('knn', 'queen'))
};

var Moran = Node.create(TYPE, PARAMS, { cache: true, version: 1,
    beforeCreate: function(node) {
        node.ignoreParamForId('significance');
        node.filters.__significance__ = {
            type: 'range',
            column: 'significance',
            params: {
                max: node.significance
            }
        };
    }
});

module.exports = Moran;
module.exports.TYPE = TYPE;
module.exports.PARAMS = PARAMS;

Moran.prototype.sql = function() {
    var neighbours = this.neighbours || 5;
    var permutations = this.permutations || 999;
    if (this.denominator_column === null) {
        return moranQueryTemplate({
            _query: this.source.getQuery(),
            _numeratorColumn: this.numerator_column,
            _wType: this.w_type,
            _neighbours: neighbours,
            _permutations: permutations
        });
    }
    return moranDenominatorQueryTemplate({
        _query: this.source.getQuery(),
        _numeratorColumn: this.numerator_column,
        _denominatorColumn: this.denominator_column,
        _wType: this.w_type,
        _neighbours: neighbours,
        _permutations: permutations
    });
};
