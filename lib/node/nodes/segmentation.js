'use strict';

var Node = require('../node');

var TYPE = 'market-prediction';
var PARAMS = {
    source: Node.PARAM.NODE(Node.GEOMETRY.POLYGON),
    target: Node.PARAM.NODE(Node.GEOMETRY.POLYGON)
   };

var MarketPrediction = Node.create(TYPE, PARAMS, { cache: true });

module.exports = MarketPrediction;
module.exports.TYPE = TYPE;
module.exports.PARAMS = PARAMS;

MarketPrediction.sql = function(){
    return '';
}
