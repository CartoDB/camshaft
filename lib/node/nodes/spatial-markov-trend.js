'use strict';

var Node = require('../node');

var spatialMarkovTrendQueryTemplate = Node.getSqlTemplateFn('spatial-markov-trend');

var TYPE = 'spatial-markov-trend';
var PARAMS = {
    source: Node.PARAM.NODE(Node.GEOMETRY.ANY),
    time_columns: Node.PARAM.ARRAY(),
    num_classes: Node.PARAM.NULLABLE(Node.PARAM.NUMBER(), 5),
    weight_type: Node.PARAM.NULLABLE(Node.PARAM.STRING(), 'knn'),
    num_ngbrs: Node.PARAM.NULLABLE(Node.PARAM.NUMBER(), 5),
    // selecting a low value, https://github.com/CartoDB/crankshaft/issues/83
    permutations: Node.PARAM.NULLABLE(Node.PARAM.NUMBER(), 1),
    geom_col: Node.PARAM.NULLABLE(Node.PARAM.STRING(), 'the_geom'),
    id_col: Node.PARAM.NULLABLE(Node.PARAM.STRING(), 'cartodb_id')
};

var SpatialMarkovTrend = Node.create(TYPE, PARAMS, { cache: true, version: 1 });

module.exports = SpatialMarkovTrend;
module.exports.TYPE = TYPE;
module.exports.PARAMS = PARAMS;

SpatialMarkovTrend.prototype.sql = function() {
    return spatialMarkovTrendQueryTemplate({
        _query: this.source.getQuery(),
        _time_columns: this.time_columns.map(function (c) {
          return '\'' + c + '\'';
        }).join(','),
        _num_classes: this.num_classes,
        _weight_type: this.weight_type,
        _num_ngbrs: this.num_ngbrs,
        _permutations: this.permutations,
        _geom_col: this.geom_col,
        _id_col: this.id_col
    });
};
