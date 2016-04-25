'use strict';

var nodes = {
    Buffer: require('./nodes/buffer'),
    Moran: require('./nodes/moran'),
    Intersection: require('./nodes/intersection'),
    AggregateIntersection: require('./nodes/aggregate-intersection'),
    PopulationInArea: require('./nodes/population-in-area'),
    Source: require('./nodes/source'),
    TradeArea: require('./nodes/trade-area')
};

module.exports = nodes;
