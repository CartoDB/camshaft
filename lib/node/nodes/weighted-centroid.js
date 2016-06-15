'use strict';

var Node = require('../node');
var dot = require('dot');

var TYPE = 'weighted-centroid';

var PARAMS = {
    source : Node.PARAM.NODE(Node.GEOMETRY.POINT),
    weight_column : Node.PARAM.STRING(),
    category_column : Node.PARAM.STRING(),
};

var WeightedCentroid = Node.create(TYPE, PARAMS, {cache: true});

module.exports = WeightedCentroid;
module.exports.TYPE = TYPE;
module.exports.PARAMS = PARAMS;

var weightedCentroidTemplate = dot.template([
    'SELECT',
    '  cdb_crankshaft.CDB_WeightedMean(the_geom, {{=it.weight_column}}::NUMERIC) as the_geom,',
    '  {{=it.category_column}} as category',
    'FROM ({{=it.query}}) q',
    'GROUP BY {{=it.category_column}}'
].join('\n'));

WeightedCentroid.prototype.sql = function(){
    return weightedCentroidTemplate({
        query : this.source.getQuery(),
        weight_column : this.weight_column,
        category_column : this.category_column
    });
};
