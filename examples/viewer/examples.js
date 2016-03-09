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
        points_source: sourceRentListings,
        polygons_source: tradeAreaDefinition
    }
};

var examples = {
    moran: {
        name: 'cluster outliers',
        def: {
            type: 'moran',
            params: {
                source: {
                    'type': 'source',
                    'params': {
                        'query': 'select * from working_from_home'
                    }
                },
                'numerator_column': 'worked_at_home',
                'denominator_column': 'workers_16_years_and_over',
                'significance': 0.05,
                'neighbours': 5,
                'permutations': 999,
                'w_type': 'queen'
            }
        },
        cartocss: [
            '@HL: #00695C;//dark teal',
            '@HH: #4DB6AC;//light teal',
            '@LL: #FB8C00;//light orange',
            '@LH: #d84315;//dark orange',
            '@notsig: transparent;',
            '@null: transparent;',
            '',
            '#layer {',
            '    polygon-opacity: 1;',
            '    line-color: #FFF;',
            '    line-width: 0;',
            '    line-opacity: 1;',
            '}',
            '',
            '#layer[quads="HH"] {',
            '    polygon-fill: @HH;',
            '}',
            '#layer[quads="HL"] {',
            '    polygon-fill: @HL;',
            '}',
            '#layer[quads="LH"] {',
            '    polygon-fill: @LH;',
            '}',
            '#layer[quads="LL"] {',
            '    polygon-fill: @LL;',
            '}',
            '#layer[significance >= 0.05] {',
            '    polygon-fill: transparent;',
            '}'
        ].join('\n'),
        center: [40.01, -101.16],
        zoom: 4
    },
    moran_input: {
        name: 'cluster outliers input',
        def: {
            'type': 'source',
            'params': {
                'query': 'select the_geom, worked_at_home, workers_16_years_and_over from working_from_home'
            }
        },
        cartocss: [
            '#layer{',
            '    polygon-fill: ramp([worked_at_home], colorbrewer(PuBu));',
            '}'
        ].join('\n'),
        center: [40.01, -101.16],
        zoom: 4
    },
    phillyProperties: {
        name: 'philly properties',
        def: {
            'type': 'point-in-polygon',
            'params': {
                'points_source': {
                    'type': 'source',
                    'params': {
                        'query': 'select the_geom, _market_value, category_code_description from properties'
                    }
                },
                'polygons_source': {
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
