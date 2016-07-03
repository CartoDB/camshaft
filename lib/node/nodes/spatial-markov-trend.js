'use strict';

var Node = require('../node');

var spatialMarkovTrendQueryTemplate = Node.getSqlTemplateFn('spatial-markov-trend');

var TYPE = 'spatial-markov-trend';
var PARAMS = {
    source: Node.PARAM.NODE(Node.GEOMETRY.ANY),
    time_columns: Node.PARAM.ARRAY()
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
        }).join(',')
    });
};
