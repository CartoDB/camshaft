'use strict';

var nodes = {
    AggregateIntersection: require('./nodes/aggregate-intersection'),
    Buffer: require('./nodes/buffer'),
    DataObservatoryMeasure: require('./nodes/data-observatory-measure'),
    FilterByNodeColumn: require('./nodes/filter-by-node-column'),
    FilterCategory: require('./nodes/filter-category'),
    FilterRange: require('./nodes/filter-range'),
    Intersection: require('./nodes/intersection'),
    KMeans: require('./nodes/kmeans'),
    Moran: require('./nodes/moran'),
    PointInPolygon: require('./nodes/point-in-polygon'),
    PopulationInArea: require('./nodes/population-in-area'),
    Source: require('./nodes/source'),
    TradeArea: require('./nodes/trade-area'),
    WeightedCentroid: require('./nodes/weighted-centroid'),
    Merge: require('./nodes/merge')
};

module.exports = nodes;
