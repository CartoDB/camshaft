'use strict';

var Node = require('../node');
var dot = require('dot');

var TYPE = 'distance-weighted-knn';

var PARAMS = {
    source_geom: Node.PARAM.NODE(Node.GEOMETRY.POINT),
    target_table: Node.PARAM.NODE(),
    val_column: Node.PARAM.NODE(Node.NUMBER),
    num_neighbors: Node.PARAM.NUMBER()
};

var weightedKnn = Node.create(TYPE, PARAMS, {cache: true});

module.exports = weightedKnn;
module.exports.TYPE = TYPE;
module.exports.PARAMS = PARAMS;

var weightedKnnQueryTemplate = dot.template([
    'SELECT cdb_crankshaft.CDB_knnWeightedAverage(',
    '  {{=it.source_geom}}, ',
    '  array_agg(the_geom), ',
    '  array_agg({{=it.val_column}}), ',
    '  {{=it.num_neighbors}}) As knn_averaged ',
    'FROM ({{=it.query}}) As q'
  ].join('\n'));

weightedKnn.prototype.sql = function() {
    return kMeansQueryTemplate({
        source_geom: this.source_geom,
        val_column: this.val_column,
        num_neighbors: this.num_neighbors,
        query: this.source.getQuery()
    });
};
