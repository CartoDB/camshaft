'use strict';

var Node = require('../node');
var dot = require('dot');

var TYPE = 'weighted-centroid';

var PARAMS = {
    source : Node.PARAM.NODE(Node.GEOMETRY.POINT),
    weight_column : Node.PARAM.STRING,
    category_column : Node.PARAM.STRING
};

var WeightedCentroid  = Node.create(TYPE, PARAMS, {cache: false});

module.exports = WeightedCentroid;
module.exports.TYPE = TYPE;
module.exports.PARAMS = PARAMS;

var weightedCentroidTemplate = dot.template([
    'SELECT the_geom , class',
    'FROM cdb_crankshaft.CDB_WeightedMean(\'{{=it.query}}\',\'{{=it.weight_column}}\',\'{{=it.category_column}}\')'
].join('\n'));

function query(it) {
    return weightedCentroidTemplate(it);
}

WeightedCentroid.prototype.sql = function(){
    return query({
        query : this.source.getQuery(),
        weight_column : this.weight_column,
        category_column : this.category_column
    });
};
        
