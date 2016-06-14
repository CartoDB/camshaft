'use strict';

var QUERY_ATM_MACHINES = 'select * from atm_machines';
var TRADE_AREA_WALK = 'walk';
var TRADE_AREA_15M = 900;
var ISOLINES = 4;

var CARTOCSS_POINTS = [
    '#layer{',
    '  marker-placement: point;',
    '  marker-allow-overlap: true;',
    '  marker-line-opacity: 0.2;',
    '  marker-line-width: 0.5;',
    '  marker-opacity: 1;',
    '  marker-width: 5;',
    '  marker-fill: red;',
    '}'
].join('\n');

var CARTOCSS_LINES = [
    '#lines {',
    '  line-color: black;',
    '  line-width: 1;',
    '  line-opacity: 1;',
    '}'
].join('\n');

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
        query: 'select * from barrios where codbarrio like \'10%\''
    }
};

var customersSourceDef = {
    id: 'customersSource',
    type: 'source',
    params: {
        query: 'select *, category::integer cat  from customers_3'
    }
};

var customersSourceDef2 = {
    id: 'customersSource',
    type: 'source',
    params: {
        query: 'select * from customers_3'
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

var WeightedCentroidDefinition = {
    id: 'weightedCentroid',
    type: 'weighted-centroid',
    params:{
        source: customersSourceDef2,
        weight_column: 'customer_v',
        category_column:'category'
    }
};

var KMeansDefinition = {
    id: 'kmeans',
    type: 'kmeans',
    params:{
      source: customersSourceDef,
      clusters : 6
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

var dataObservatoryMeasureAdultsFirstLevelStudies = {
    id: 'data-observatory-measure-adults-first-level-studies',
    type: 'data-observatory-measure',
    params: {
        source: sourceBarrios,
        final_column: 'adults_first_level_studies',
        segment_name: 'es.ine.t15_8'
    }
};

var dataObservatoryMeasureAdultsFirstLevelStudiesPercent = {
    id: 'data-observatory-measure-adults-first-level-studies-percent',
    type: 'data-observatory-measure',
    params: {
        source: sourceBarrios,
        final_column: 'adults_first_level_studies_percent',
        segment_name: 'es.ine.t15_8',
        percent: true
    }
};

var examples = {
    moran_sids2: {
        name: 'cluster sids2',
        def: {
            id: 'moran-demo',
            type: 'moran',
            params: {
                source: {
                    type: 'source',
                    params: {
                        query: 'select * from sids2'
                    }
                },
                numerator_column: 'bir79',
                //denominator_column: 'sid79',
                w_type: 'queen',
                //neighbours: 5,
                //permutations: 999,
                significance: 0.05
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
        center: [35.853, -79.563],
        zoom: 7
    },
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
    buffer_radius_dissolved: {
        name: 'populated places radius dissolved',
        //sql_wrap: 'select st_envelope(the_geom_webmercator) as the_geom_webmercator from (<%= sql %>) as _q',
        def: {
            id: UUID,
            type: 'buffer',
            params: {
                radius: 9000,
                dissolved: true,
                source: {
                    id: 'a0',
                    type: 'source',
                    params: {
                        query: 'select * from paradas_metro_madrid'
                    }
                }
            }
        },
        dataviews: {},
        filters: {},
        cartocss: [
            '#layer{',
            '  polygon-fill: red;',
            '  polygon-opacity: 0.2;',
            '}'
        ].join('\n'),
        center: [40.44, -3.7],
        zoom: 10
    },
    buffer_radius_isolines: {
        name: 'populated places radius isolines',
        def: {
            id: UUID,
            type: 'buffer',
            params: {
                radius: 9000,
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
            '  polygon-fill: ramp([data_range], (red, green, blue), (0, 3000, 6000));',
            '  polygon-opacity: 0.2;',
            '}'
        ].join('\n'),
        center: [40.44, -3.7],
        zoom: 10
    },
    buffer_radius_isolines_dissolved: {
        name: 'populated places radius isolines dissolved',
        sql_wrap: 'select data_range, st_envelope(the_geom_webmercator) the_geom_webmercator from (<%= sql %>) as _q',
        def: {
            id: UUID,
            type: 'buffer',
            params: {
                radius: 15000,
                isolines: 3,
                dissolved: true,
                source: {
                    id: 'a0',
                    type: 'source',
                    params: {
                        query: 'select * from paradas_metro_madrid'
                    }
                }
            }
        },
        dataviews: {},
        filters: {},
        cartocss: [
            '#layer{',
            '  polygon-fill: ramp([data_range], (red, green, blue), (0, 5000, 10000));',
            '  polygon-opacity: 0.2;',
            '}'
        ].join('\n'),
        center: [40.44, -3.7],
        zoom: 10
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
        cartocss: CARTOCSS_POINTS,
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
        cartocss: CARTOCSS_POINTS,
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
        cartocss: CARTOCSS_POINTS,
        center: [40.44, -3.7],
        zoom: 12
    },
    pointsInPolygonFiltered: {
        name: 'airbnb in atm trade areas (filtered)',
        def: pointsInPolygonDefinition,
        cartocss: CARTOCSS_POINTS,
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
    weighted_centroid_populated_builder: {
        name: 'weighted-centroid populated places',
        def: {
            id: 'weightedCentroid',
            type: 'weighted-centroid',
            params:{
                source: {
                    id: 'kmeans',
                    type: 'kmeans',
                    params:{
                        source: populatedPlacesSource,
                        clusters : 10
                    }
                },
                weight_column: 'pop_max',
                category_column: 'cluster_no'
            }
        },
        cartocss:[
            '#layer{',
            '  marker-fill: red;',
            '  marker-line-width: 0.5;',
            '  marker-allow-overlap: true;',
            '  marker-width: 20;',
            '}'
        ].join('\n'),
        debugLayers: [
            {
                type: 'cartodb',
                options: {
                    source: { id: 'kmeans' },
                    cartocss: [
                        '@1: #E58606;',
                        '@2: #5D69B1;',
                        '@3: #52BCA3;',
                        '@4: #99C945;',
                        '@5: #2F8AC4;',
                        '@6: #24796C;',
                        '#layer{',
                        '  [cluster_no =0]{marker-fill:@1;}',
                        '  [cluster_no =1]{marker-fill:@2;}',
                        '  [cluster_no =2]{marker-fill:@3;}',
                        '  [cluster_no =3]{marker-fill:@4;}',
                        '  [cluster_no =4]{marker-fill:@5;}',
                        '  [cluster_no =5]{marker-fill:@6;}',
                        '  marker-fill: grey;',
                        '  marker-line-width: 0.5;',
                        '  marker-allow-overlap: true;',
                        '  marker-width: 10.0;',
                        '}'
                    ].join('\n'),
                    cartocss_version: '2.3.0'
                }
            }
        ],
        center: [40.44, -3.7],
        zoom: 3
    },
    kmeans:{
        name: 'kmeans_clustering',
        def: KMeansDefinition,
        cartocss:[
            '@1: #E58606;',
            '@2: #5D69B1;',
            '@3: #52BCA3;',
            '@4: #99C945;',
            '@5: #2F8AC4;',
            '@6: #24796C;',
            '#layer{',
            '  [cluster_no =0]{marker-fill:@1;}',
            '  [cluster_no =1]{marker-fill:@2;}',
            '  [cluster_no =2]{marker-fill:@3;}',
            '  [cluster_no =3]{marker-fill:@4;}',
            '  [cluster_no =4]{marker-fill:@5;}',
            '  [cluster_no =5]{marker-fill:@6;}',
            '  marker-fill: red;',
            '  marker-width: 10.0;',
            '}'
        ].join('\n'),
        center: [45.5231, -122.6765],
        zoom: 12
    },
    weighted_centroid:{
        name: 'weighted-centroid',
        def: WeightedCentroidDefinition,
        cartocss:[
            '@1: #E58606;',
            '@2: #5D69B1;',
            '@3: #52BCA3;',
            '@4: #99C945;',
            '@5: #2F8AC4;',
            '@6: #24796C;',
            '#layer{',
            '  [category =0]{marker-fill:@1;}',
            '  [category =1]{marker-fill:@2;}',
            '  [category =2]{marker-fill:@3;}',
            '  [category =3]{marker-fill:@4;}',
            '  [category =4]{marker-fill:@5;}',
            '  [category =5]{marker-fill:@6;}',
            '  marker-fill: red;',
            '  marker-width: 10.0;',
            '}'
        ].join('\n'),
        center: [45.5231, -122.6765],
        zoom: 12
    },
    kmeans_populated:{
        name: 'kmeans clustering populated',
        def: {
            id: 'kmeans',
            type: 'kmeans',
            params:{
                source: populatedPlacesSource,
                clusters : 5
            }
        },
        cartocss:[
            '@1: #E58606;',
            '@2: #5D69B1;',
            '@3: #52BCA3;',
            '@4: #99C945;',
            '@5: #2F8AC4;',
            '@6: #24796C;',
            '#layer{',
            '  [cluster_no =0]{marker-fill:@1;}',
            '  [cluster_no =1]{marker-fill:@2;}',
            '  [cluster_no =2]{marker-fill:@3;}',
            '  [cluster_no =3]{marker-fill:@4;}',
            '  [cluster_no =4]{marker-fill:@5;}',
            '  [cluster_no =5]{marker-fill:@6;}',
            '  marker-fill: red;',
            '  marker-line-width: 0.5;',
            '  marker-allow-overlap: true;',
            '  marker-width: 10.0;',
            '}'
        ].join('\n'),
        center: [40.44, -3.7],
        zoom: 3
    },
    kmeans_phil_properties: {
        name: 'kmeans clustering phily properties',
        def: {
            id: 'kmeans',
            type: 'kmeans',
            params:{
                source: {
                    type: 'source',
                    params: {
                        query: 'select cartodb_id, the_geom, _market_value from properties where the_geom is not null'
                    }
                },
                clusters : 6
            }
        },
        cartocss:[
            '@1: #E58606;',
            '@2: #5D69B1;',
            '@3: #52BCA3;',
            '@4: #99C945;',
            '@5: #2F8AC4;',
            '@6: #24796C;',
            '#layer{',
            '  [cluster_no =0]{marker-fill:@1;}',
            '  [cluster_no =1]{marker-fill:@2;}',
            '  [cluster_no =2]{marker-fill:@3;}',
            '  [cluster_no =3]{marker-fill:@4;}',
            '  [cluster_no =4]{marker-fill:@5;}',
            '  [cluster_no =5]{marker-fill:@6;}',
            '  marker-fill: red;',
            '  marker-line-width: 0.1;',
            '  marker-line-color: #ccc;',
            '  marker-allow-overlap: true;',
            '  marker-width: 4;',
            '}'
        ].join('\n'),
        center: [40.009, -75.134],
        zoom: 12
    },
    weighted_centroid_properties: {
        name: 'weighted-centroid properties',
        sql_wrap: 'select category::text as category, the_geom_webmercator from (<%= sql %>) q',
        def: {
            id: 'weightedCentroid',
            type: 'weighted-centroid',
            params:{
                source: {
                    id: UUID,
                    type: 'source',
                    params: {
                        query: [
                            'SELECT cartodb_id, the_geom, _market_value, _year_built::integer',
                            'FROM properties'
                        ].join(' ')
                    }
                },
                weight_column: '_market_value',
                category_column:'_year_built'
            }
        },
        cartocss:[
            '#layer{',
            '  marker-fill: ramp([category], colorbrewer(Paired, 12), category);',
            '  marker-line-width: 0.5;',
            '  marker-allow-overlap: true;',
            '  marker-width: 10;',
            '}'
        ].join('\n'),
        center: [40.009, -75.134],
        zoom: 12
    },
    'do-measure-adults-first-level-studies': {
        name: 'number of adults with first level studies',
        def: dataObservatoryMeasureAdultsFirstLevelStudies,
        cartocss: [
            '#layer{',
            '  polygon-fill: ramp([adults_first_level_studies], colorbrewer(Reds));',
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
    'do-measure-adults-first-level-studies-percent': {
        name: 'percent of adults with first level studies',
        def: dataObservatoryMeasureAdultsFirstLevelStudiesPercent,
        cartocss: [
            '#layer{',
            '  polygon-fill: ramp([adults_first_level_studies_percent], colorbrewer(Reds));',
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
    filterByNodeColumn: {
        name: 'filter by node column',
        def: {
            id: 'HEAD',
            type: 'filter-by-node-column',
            params: {
                source: {
                    id: 'roads-source',
                    type: 'source',
                    params: {
                        query: 'select * from roads'
                    }
                },
                column: 'ref',
                filter_source: {
                    id: 'radares-source',
                    type: 'source',
                    params: {
                        query: 'select * from radares'
                    }
                },
                filter_column: 'road_number'
            }
        },
        dataviews: {
            road_name: {
                source: {
                    id: 'radares-source'
                },
                type: 'aggregation',
                options: {
                    column: 'road_number',
                    aggregation: 'count'
                }
            }
        },
        filters: {
            dataviews: {
                road_name: {
                    accept: [1,2,3,4,5,6].map(function(i) { return 'A-' + i; })
                }
            }
        },
        sourceId: 'radares-source',
        debugLayers: [
            {
                type: 'cartodb',
                options: {
                    source: { id: 'HEAD' },
                    cartocss: CARTOCSS_LINES,
                    cartocss_version: '2.3.0'
                }
            }
        ],
        cartocss: CARTOCSS_POINTS,
        center: [40.44, -3.7],
        zoom: 6
    }
};
