'use strict';

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

var pointsInPolygonDefinition = {
    type: 'point-in-polygon',
    params: {
        pointsSource: sourceRentListings,
        polygonsSource: tradeAreaDefinition
    }
};

var examples = {
    pointsInPolygon: {
        name: 'airbnb in atm trade areas',
        def: pointsInPolygonDefinition,
        cartocss: [
            '#layer{',
            '  marker-placement: point;',
            '  marker-allow-overlap: true;',
            '  marker-line-opacity: 0.2;',
            '  marker-line-width: 0.5;',
            '  marker-opacity: 1;',
            '  marker-width: 5;',
            '  marker-fill: red;',
            '}'
        ].join('\n'),
        center: [40.44, -3.7],
        zoom: 12
    }
};
