'use strict';

var nodes = {
    AggregateIntersection: require('./nodes/aggregate-intersection'),
    Buffer: require('./nodes/buffer'),
    ConvexHull: require('./nodes/convex-hull'),
    DataObservatoryMeasure: require('./nodes/data-observatory-measure'),
    FilterByNodeColumn: require('./nodes/filter-by-node-column'),
    FilterCategory: require('./nodes/filter-category'),
    FilterRange: require('./nodes/filter-range'),
    FilterRank: require('./nodes/filter-rank'),
    GeoreferenceAdminRegion: require('./nodes/georeference-admin-region'),
    GeoreferenceCity: require('./nodes/georeference-city'),
    GeoreferenceIpAddress: require('./nodes/georeference-ip-address'),
    GeoreferenceLongLat: require('./nodes/georeference-long-lat'),
    GeoreferencePostalCode: require('./nodes/georeference-postal-code'),
    GeoreferenceStreetAddress: require('./nodes/georeference-street-address'),
    Intersection: require('./nodes/intersection'),
    KMeans: require('./nodes/kmeans'),
    LinkByLine: require('./nodes/link-by-line'),
    Moran: require('./nodes/moran'),
    PointInPolygon: require('./nodes/point-in-polygon'),
    PopulationInArea: require('./nodes/population-in-area'),
    Sampling: require('./nodes/sampling'),
    Source: require('./nodes/source'),
    TradeArea: require('./nodes/trade-area'),
    WeightedCentroid: require('./nodes/weighted-centroid'),
    weightedKnn: require('./nodes/distance-weighted-knn')
};

module.exports = nodes;
