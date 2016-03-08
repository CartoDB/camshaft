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
        query: 'select * from airbnb_madrid_oct_2015_listings'
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
    mapboxBlogPost: {
    phillyProperties: {
        name: 'philly properties',
        def: {
            'type': 'point-in-polygon',
            'params': {
                'pointsSource': {
                    'type': 'source',
                    'params': {
                        'query': 'select the_geom, _market_value, category_code_description from properties'
                    }
                },
                'polygonsSource': {
                    'type': 'buffer',
                    'params': {
                        'source': {
                            'type': 'source',
                            'params': {
                                'query': [
                                    'SELECT',
                                    '1 as cartodb_id,',
                                    'ST_SetSRID(st_makepoint(-75.176,39.946), 4326) as the_geom'
                                ].join(' ')
                            }
                        },
                        'radio': 2000
                    }
                }
            }
        },
        cartocss: [
            '/*colorbrewer: Set1*/',
            '@green: #4daf4a;',
            '@magenta: #984ea3;',
            '@blue: #377eb8;',
            '@red: #e41a1c;',
            '@orange: #ff7f00;',
            '@yellow: #ffff33;',
            '',
            '#layer{',
            '    marker-placement: point;',
            '    marker-allow-overlap: true;',
            '    marker-line-opacity: 0.2;',
            '    marker-line-width: 0;',
            '    marker-width: ramp([_market_value], 1, 8, headtails);',
            '    [category_code_description=\'RESIDENTIAL\'] {marker-fill: @green;}',
            '    [category_code_description=\'COMMERCIAL\'] {marker-fill: @magenta;}',
            '    [category_code_description=\'HOTELS AND APARTMENTS\'] {marker-fill: @blue;}',
            '    [category_code_description=\'STORE WITH DWELLING\'] {marker-fill: @red;}',
            '    [category_code_description=\'VACANT LAND\'] {marker-fill: @orange;}',
            '    [category_code_description=\'INDUSTRIAL\'] {marker-fill: @yellow;}',
            '}'
        ].join('\n'),
        center: [39.946, -75.176],
        zoom: 15
    },
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
