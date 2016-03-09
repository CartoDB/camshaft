'use strict';

var nodes = {
    Buffer: require('./buffer/buffer'),
    Moran: require('./moran/moran'),
    PointInPolygon: require('./point-in-polygon/point-in-polygon'),
    Source: require('./source/source'),
    TradeArea: require('./trade-area/trade-area')
};

module.exports = nodes;
