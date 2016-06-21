'use strict';

var nodes = {
    AggregateIntersection: require('./nodes/aggregate-intersection'),
    Buffer: require('./nodes/buffer'),
    DataObservatoryMeasure: require('./nodes/data-observatory-measure'),
    FilterByNodeColumn: require('./nodes/filter-by-node-column'),
    FilterCategory: require('./nodes/filter-category'),
    FilterRange: require('./nodes/filter-range'),
    GeoreferenceAdminRegion: require('./nodes/georeference-admin-region'),
    GeoreferenceCity: require('./nodes/georeference-city'),
    GeoreferenceIpAddress: require('./nodes/georeference-ip-address'),
    GeoreferenceLongLat: require('./nodes/georeference-long-lat'),
    GeoreferencePostalCode: require('./nodes/georeference-postal-code'),
    GeoreferenceStreetAddress: require('./nodes/georeference-street-address'),
    Intersection: require('./nodes/intersection'),
    KMeans: require('./nodes/kmeans'),
    Moran: require('./nodes/moran'),
    PointInPolygon: require('./nodes/point-in-polygon'),
    PopulationInArea: require('./nodes/population-in-area'),
    Source: require('./nodes/source'),
    TradeArea: require('./nodes/trade-area'),
    WeightedCentroid: require('./nodes/weighted-centroid')
};

module.exports = nodes;
