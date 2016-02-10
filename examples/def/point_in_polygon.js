var QUERY_ATM_MACHINES = 'select * from atm_machines';
var TRADE_AREA_WALK = 'walk';
var TRADE_AREA_15M = 900;

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

var tradeAreaDefinition = {
    type: 'trade-area',
    params: {
        source: sourceAtmDef,
        kind: TRADE_AREA_WALK,
        time: TRADE_AREA_15M
    }
};

var estimatedPopulationDefinition = {
    type: 'estimated-population',
    params: {
        source: tradeAreaDefinition
    }
};

var pointsInPolygonDefinition = {
    type: 'point-in-polygon',
    params: {
        pointsSource: sourceRentListings,
        polygonsSource: estimatedPopulationDefinition
    }
};

module.exports = pointsInPolygonDefinition;