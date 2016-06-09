'use strict';

var nodes = {
    AggregateIntersection: require('./nodes/aggregate-intersection'),
    Buffer: require('./nodes/buffer'),
    FilterCategory: require('./nodes/filter-category'),
    FilterRange: require('./nodes/filter-range'),
    Intersection: require('./nodes/intersection'),
    Moran: require('./nodes/moran'),
    PointInPolygon: require('./nodes/point-in-polygon'),
    PopulationInArea: require('./nodes/population-in-area'),
    Source: require('./nodes/source'),
    TradeArea: require('./nodes/trade-area'),
    WeightedCentroid: require('./nodes/weighted-centroid'),
    KMeans: require('./nodes/kmeans')
};

module.exports = nodes;
