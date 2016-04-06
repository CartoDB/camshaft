'use strict';

var nodes = {
    Buffer: require('./nodes/buffer'),
    Moran: require('./nodes/moran'),
    PointInPolygon: require('./nodes/point-in-polygon'),
    PopulationInArea: require('./nodes/population-in-area'),
    RandomGeometry: require('./nodes/random-geometry'),
    Source: require('./nodes/source'),
    TradeArea: require('./nodes/trade-area')
};

module.exports = nodes;
