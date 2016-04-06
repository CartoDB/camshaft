'use strict';

var nodes = {
    Buffer: require('./nodes/buffer'),
    Moran: require('./nodes/moran'),
    PointInPolygon: require('./nodes/point-in-polygon'),
    Source: require('./nodes/source'),
    TradeArea: require('./nodes/trade-area')
};

module.exports = nodes;
