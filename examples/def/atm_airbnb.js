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
        query: 'select the_geom, listing_url, price from airbnb_madrid_oct_2015_listings'
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

var intersectionDefinition = {
    type: 'intersection',
    params: {
        source_a: sourceRentListings,
        source_b: tradeAreaDefinition
    }
};

module.exports = intersectionDefinition;
