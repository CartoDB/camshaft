var QUERY_ATM_MACHINES = 'select * from atm_machines';

var sourceAtmDef = {
    type: 'source',
    params: {
        query: QUERY_ATM_MACHINES
    }
};

var sourceRentListings = {
    type: 'source',
    params: {
        query: 'select * from rent_listings'
    }
};

var bufferDefinition = {
    type: 'buffer',
    params: {
        source: sourceAtmDef,
        radius: 1000
    }
};

var bufferEstimatedPopulationDefinition = {
    type: 'estimated-population',
    params: {
        source: bufferDefinition
    }
};

var pointsInPolygonDefinition = {
    type: 'point-in-polygon',
    params: {
        points_source: sourceRentListings,
        polygons_source: bufferEstimatedPopulationDefinition
    }
};

module.exports = pointsInPolygonDefinition;
