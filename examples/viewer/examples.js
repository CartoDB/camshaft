'use strict';

var QUERY_ATM_MACHINES = 'select * from atm_machines';
var TRADE_AREA_WALK = 'walk';
var TRADE_AREA_15M = 900;
var ISOLINES = 4;

var sourceAtmDef = {
    type: 'source',
    params: {
        query: QUERY_ATM_MACHINES
    }
};

var sourceRentListings = {
    id: 'airbnb-source',
    type: 'source',
    params: {
        query: 'select * from airbnb_madrid_oct_2015_listings'
    }
};

var sourceExpensiveRentListings = {
    id: 'expensive-airbnb-source',
    type: 'source',
    params: {
        query: 'select * from airbnb_madrid_oct_2015_listings where price > 100'
    }
}

var sourceBarrios = {
    id: 'barrios-source',
    type: 'source',
    params: {
        query: 'select * from barrios'
    }
};

var sourceLaLatina = {
    id: 'barrios-source',
    type: 'source',
    params: {
        query: "select * from barrios where codbarrio like '10%'"
    }
};

var tradeAreaDefinition = {
    id: 'ta-example',
    type: 'trade-area',
    params: {
        source: sourceAtmDef,
        kind: TRADE_AREA_WALK,
        time: TRADE_AREA_15M,
        isolines: ISOLINES,
        dissolved: false
    }
};


var intersectionDefinition = {
    id: 'intersection-example-1',
    type: 'intersection',
    params: {
        source: sourceLaLatina,
        target: sourceRentListings
    }
};


var aggregateIntersectionDefinition = {
    id: 'aggregate-intersection-example-1',
    type: 'aggregate-intersection',
    params: {
        source: sourceRentListings,
        target: sourceBarrios,
        aggregate_function: 'max',
        aggregate_column: 'price'
    }
};

var pointsInPolygonDefinition = {
    type: 'point-in-polygon',
    params: {
        points_source: sourceRentListings,
        polygons_source: tradeAreaDefinition
    }
};

var UUID = '4d82e8df-f21b-4225-b776-61b1bdffde6c';
var populatedPlacesSource = {
    id: UUID,
    type: 'source',
    params: {
        query: 'select * from populated_places_simple'
    }
};

var moranDefinition = {
    id: 'moran-demo',
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
};

var tradeAreaAtmMachines = {
    id: 'taam-example',
    type: 'trade-area',
    params: {
        source: sourceAtmDef,
        kind: TRADE_AREA_WALK,
        time: 1000,
        isolines: ISOLINES,
        dissolved: false
    }
};

var sourceMod2IdsBarrios = {
    id: 'even-barrios-source',
    type: 'source',
    params: {
        query: 'select * from barrios where mod(cartodb_id, 2) = 0'
    }
};

var sourceMod4IdsBarrios = {
    id: 'odd-barrios-source-',
    type: 'source',
    params: {
        query: 'select * from barrios where mod(cartodb_id, 4) = 0'
    }
};

var mergeBarrios = {
    id: 'merge-example',
    type: 'merge',
    params: {
        input_left: sourceMod2IdsBarrios,
        input_left_column_on: 'cartodb_id',
        input_left_columns: ['nombre', 'codbarrio'],
        input_right: sourceMod4IdsBarrios,
        input_right_column_on: 'cartodb_id',
        input_right_columns: ['nomdis', 'codbar'],
        join_type: 'left'
    }
};

var examples = {
    buffer_radius: {
        name: 'populated places radius',
        def: {
            id: UUID,
            type: 'buffer',
            params: {
                radius: 1500,
                source: {
                    id: 'a0',
                    type: 'source',
                    params: {
                        query: 'select * from populated_places_simple'
                    }
                }
            }
        },
        dataviews: {},
        filters: {},
        cartocss: [
            '#layer{',
            '  polygon-fill: red;',
            '  polygon-opacity: 1.0;',
            '}'
        ].join('\n'),
        center: [40.44, -3.7],
        zoom: 12
    },
    buffer_radius_isolines: {
        name: 'populated places radius isolines',
        def: {
            id: UUID,
            type: 'buffer',
            params: {
                radius: 1500,
                isolines: 3,
                source: {
                    id: 'a0',
                    type: 'source',
                    params: {
                        query: 'select * from populated_places_simple'
                    }
                }
            }
        },
        dataviews: {},
        filters: {},
        cartocss: [
            '#layer{',
            '  polygon-fill: ramp([data_range], (red, green, blue), (0, 500, 1000));',
            '  polygon-opacity: 1.0;',
            '}'
        ].join('\n'),
        center: [40.44, -3.7],
        zoom: 12
    },
    buffer_radius_isolines_dissolved: {
        name: 'populated places radius dissolved',
        def: {
            id: UUID,
            type: 'buffer',
            params: {
                radius: 1500,
                isolines: 5,
                dissolved: true,
                source: {
                    id: 'a0',
                    type: 'source',
                    params: {
                        query: 'select * from populated_places_simple'
                    }
                }
            }
        },
        dataviews: {},
        filters: {},
        cartocss: [
            '#layer{',
            '  polygon-fill: ramp([data_range], (red, green, blue), (0, 500, 1000));',
            '  polygon-opacity: 1.0;',
            '}'
        ].join('\n'),
        center: [40.44, -3.7],
        zoom: 12
    },
    population_in_trade_area: {
        name: 'population in trade area',
        def: {
            type: 'population-in-area',
            params: {
                final_column: 'population',
                source: tradeAreaDefinition
            }
        },
        cartocss: [
            '#layer{',
            '  polygon-fill: red;',
            '  polygon-opacity: 1.0;',
            '}'
        ].join('\n'),
        center: [40.44, -3.7],
        zoom: 12
    },
    atm_machines_in_trade_area: {
        name: 'atm machines in trade area',
        def: tradeAreaAtmMachines,
        cartocss: [
            '#layer{',
            '  polygon-fill: red;',
            '  polygon-opacity: 0.6;',
            '  polygon-opacity: 0.7;',
            '  line-color: #FFF;',
            '  line-width: 0.5;',
            '  line-opacity: 1;',
            '}'
        ].join('\n'),
        center: [40.44, -3.7],
        zoom: 12
    },
    population_in_moran: {
        name: 'population in moran',
        def: {
            type: 'population-in-area',
            params: {
                final_column: 'population',
                source: moranDefinition
            }
        },
        cartocss: [
            '#layer{',
            '  polygon-fill: red;',
            '  /*polygon-fill: ramp([population], colorbrewer(Reds));*/',
            '  polygon-opacity: 1.0;',
            '}'
        ].join('\n'),
        center: [40.01, -101.16],
        zoom: 4
    },
    popuplated_places_radius: {
        name: 'populated places radius',
        def: {
            id: UUID,
            type: 'buffer',
            params: {
                radius: 10000,
                source: {
                    id: 'a0',
                    type: 'source',
                    params: {
                        query: 'select * from populated_places_simple'
                    }
                }
            }
        },
        dataviews: {},
        filters: {},
        cartocss: [
            '#layer{',
            '  polygon-fill: red;',
            '  polygon-opacity: 1.0;',
            '}'
        ].join('\n'),
        center: [40.44, -3.7],
        zoom: 3
    },
    dataviews: {
        name: 'airbnb in atm trade areas',
        def: pointsInPolygonDefinition,
        dataviews: {
            price_histogram: {
                source: {
                    id: 'airbnb-source'
                },
                type: 'histogram',
                options: {
                    column: 'price'
                }
            },
            number_of_reviews_histogram: {
                source: {
                    id: 'airbnb-source'
                },
                type: 'histogram',
                options: {
                    column: 'number_of_reviews'
                }
            }
        },
        filters: {
            dataviews: {
                price_histogram: {
                    min: 50,
                    max: 200
                },
                number_of_reviews_histogram: {
                    min: 5
                }
            }
        },
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
    },
    pop_places_radius: {
        name: 'populated places radius',
        def: {
            id: UUID,
            type: 'buffer',
            params: {
                radius: 10000,
                source: {
                    id: 'a0',
                    type: 'source',
                    params: {
                        query: 'select * from populated_places_simple'
                    }
                }
            }
        },
        dataviews: {
            pop_max_histogram: {
                source: {
                    id: UUID
                },
                type: 'histogram',
                options: {
                    column: 'pop_max'
                }
            },
            by_country_count_aggregation: {
                source: {
                    id: UUID
                },
                type: 'aggregation',
                options: {
                    column: 'adm0_a3',
                    aggregation: 'count'
                }
            },
            pop_max_formula_sum: {
                source: {
                    id: UUID
                },
                type: 'formula',
                options: {
                    column: 'pop_max',
                    operation: 'sum'
                }
            },
            names_list: {
                source: {
                    id: UUID
                },
                type: 'list',
                options: {
                    columns: ['name']
                }
            }
        },
        filters: {},
        cartocss: [
            '#layer{',
            '  polygon-fill: red;',
            '  polygon-opacity: 1.0;',
            '}'
        ].join('\n'),
        center: [40.44, -3.7],
        zoom: 3
    },
    populated_places: {
        name: 'populated places filtered',
        def: populatedPlacesSource,
        dataviews: {
            pop_max_histogram: {
                source: {
                    id: UUID
                },
                type: 'histogram',
                options: {
                    column: 'pop_max'
                }
            },
            by_country_count_aggregation: {
                source: {
                    id: UUID
                },
                type: 'aggregation',
                options: {
                    column: 'adm0_a3',
                    aggregation: 'count'
                }
            },
            pop_max_formula_sum: {
                source: {
                    id: UUID
                },
                type: 'formula',
                options: {
                    column: 'pop_max',
                    operation: 'sum'
                }
            },
            names_list: {
                source: {
                    id: UUID
                },
                type: 'list',
                options: {
                    columns: ['name']
                }
            }
        },
        filters: {
            dataviews: {
                pop_max_histogram: {
                    min: 1e6
                },
                by_country_count_aggregation: {
                    accept: ['FRA']
                }
            }
        },
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
        zoom: 3
    },
    moran: {
        name: 'cluster outliers',
        def: moranDefinition,
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
                        'radius': 2000
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
    },
    pointsInPolygonFiltered: {
        name: 'airbnb in atm trade areas (filtered)',
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
        dataviews: {
            price_histogram: {
                source: {
                    id: 'airbnb-source'
                },
                type: 'histogram',
                options: {
                    column: 'price'
                }
            }
        },
        filters: {
            dataviews: {
                price_histogram: {
                    max: 200
                }
            }
        },
        center: [40.44, -3.7],
        zoom: 12
    },
    intersection: {
        name: 'airbnb and districts intersection',
        def: intersectionDefinition,
        cartocss: [
            '#layer{',
            '  polygon-fill: red;',
            '  polygon-opacity: 0.6;',
            '  polygon-opacity: 0.7;',
            '  line-color: #FFF;',
            '  line-width: 0.5;',
            '  line-opacity: 1;',
            '}'
        ].join('\n'),
        center: [40.44, -3.7],
        zoom: 12
    },
    'aggregate-intersection': {
        name: 'airbnb and districts intersection with max price aggregation',
        def: aggregateIntersectionDefinition,
        cartocss: [
            '#layer{',
            '  polygon-fill: ramp([max_price], colorbrewer(Reds));',
            '  polygon-opacity: 0.6;',
            '  polygon-opacity: 0.7;',
            '  line-color: #FFF;',
            '  line-width: 0.5;',
            '  line-opacity: 1;',
            '}'
        ].join('\n'),
        center: [40.44, -3.7],
        zoom: 12
    },
    merge: {
        name: 'merge barrios',
        def: mergeBarrios,
        cartocss: [
            '#layer{',
            '  polygon-fill: #f42220;',
            '  polygon-opacity: 0.6;',
            '  polygon-opacity: 0.7;',
            '  line-color: #FFF;',
            '  line-width: 0.5;',
            '  line-opacity: 1;',
            '}'
        ].join('\n'),
        center: [40.44, -3.7],
        zoom: 12
    }
};
