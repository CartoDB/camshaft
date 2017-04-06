'use strict';

var QUERY_ATM_MACHINES = 'select * from atm_machines';
var TRADE_AREA_WALK = 'walk';
var TRADE_AREA_15M = 900;
var ISOLINES = 4;

function points(markerFill, opacity) {
    return [
        '#layer{',
        '  marker-placement: point;',
        '  marker-allow-overlap: true;',
        '  marker-line-opacity: 0.2;',
        '  marker-line-width: 0.5;',
        '  marker-opacity: '+(Number.isFinite(opacity) ? opacity : 1)+';',
        '  marker-width: 5;',
        '  marker-fill: ' + markerFill + ';',
        '}'
    ].join('\n');
}

var CARTOCSS_POINTS = points('red');

var CARTOCSS_LINES = [
    '#lines {',
    '  line-color: black;',
    '  line-width: 1;',
    '  line-opacity: 1;',
    '}'
].join('\n');

var CARTOCSS_POLYGONS = [
    '#layer {',
    '  polygon-fill: red;',
    '  polygon-opacity: 0.6;',
    '  polygon-opacity: 0.7;',
    '  line-color: #FFF;',
    '  line-width: 0.5;',
    '  line-opacity: 1;',
    '}'
].join('\n');

function labels(column) {
    return [
        '#layer::labels {',
        '    text-name: [' + column + '];',
        '    text-face-name: \'DejaVu Sans Book\';',
        '    text-size: 10;',
        '    text-label-position-tolerance: 10;',
        '    text-fill: #000;',
        '    text-halo-fill: #FFF;',
        '    text-halo-radius: 1;',
        '    text-dy: 0;',
        '    text-allow-overlap: true;',
        '    text-placement: point;',
        '    text-placement-type: simple;',
        '}',
    ].join('\n');
}

var CARTOCSS_LABELS = labels('category');

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
        source: sourceBarrios,
        target: sourceRentListings,
        aggregate_function: 'max',
        aggregate_column: 'price'
    }
};

var aggregateIntersectionDensityDefinition = {
    id: 'aggregate-intersection-density-example-1',
    type: 'aggregate-intersection',
    params: {
        source: sourceBarrios,
        target: sourceRentListings,
        aggregate_function: 'count',
        aggregate_column: 'cartodb_id'
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

var adminRegionsFromPopulatedPlacesSimpleSource = {
    id: 'adminRegions-from-populated-places-simple-source',
    type: 'source',
    params: {
        query: 'select adm1name as admin_region, adm0name as country from populated_places_simple where adm0name = \'Spain\''
    }
};

var georeferenceAdminRegionDefinition = {
    id: 'georeference-admin-region-definition',
    type: 'georeference-admin-region',
    params: {
        source: adminRegionsFromPopulatedPlacesSimpleSource,
        admin_region_column: 'admin_region',
        country_column: 'country'
    }
};

var citiesFromPopulatedPlacesSimpleSource = {
    id: 'cities-from-populated-places-simple-source',
    type: 'source',
    params: {
        query: 'select name as city, adm1name as admin_region, adm0name as country from populated_places_simple where adm0name = \'Spain\''
    }
};

var georeferenceCityDefinition = {
    id: 'georeference-city-definition',
    type: 'georeference-city',
    params: {
        source: citiesFromPopulatedPlacesSimpleSource,
        city_column: 'city',
        admin_region_column: 'admin_region',
        country_column: 'country'
    }
};

var georeferenceIpAddressSource = {
    id: 'georeference-ip-address-source',
    type: 'source',
    params: {
        query: 'select adm0name as ip_address from populated_places_simple where adm0name = \'Spain\''
    }
};

var georeferenceIpAddressDefinition = {
    id: 'georeference-ip-address-definition',
    type: 'georeference-ip-address',
    params: {
        source: georeferenceIpAddressSource,
        ip_address: 'ip_address'
    }
};

var georeferenceLongLatSource = {
    id: 'georeference-long-lat-source',
    type: 'source',
    params: {
        query: 'select st_x(the_geom) as longitude, st_y(the_geom) as latitude from atm_madrid'
    }
};

var georeferenceLongLatDefinition = {
    id: 'georeference-long-lat-definition',
    type: 'georeference-long-lat',
    params: {
        source: georeferenceLongLatSource,
        longitude: 'longitude',
        latitude: 'latitude'
    }
};

var postalCodesFromPopulatedPlacesSimpleSource = {
    id: 'postal-codes-from-populated-places-simple-source',
    type: 'source',
    params: {
        query: 'select cartodb_id::text as postal_code, adm0name as country from populated_places_simple where adm0name = \'Spain\''
    }
};

var georeferencePostalCodeDefinition = {
    id: 'georeference-postal-code-definition',
    type: 'georeference-postal-code',
    params: {
        source: postalCodesFromPopulatedPlacesSimpleSource,
        postal_code_column: 'postal_code',
        country_column: 'country'
    }
};

var georeferenceStreetAddressSource = {
    id: 'georeference-street-address-source',
    type: 'source',
    params: {
        query: 'select cartodb_id::text as street_address from populated_places_simple where adm0name = \'Spain\''
    }
};

var georeferenceStreetAddressDefinition = {
    id: 'georeference-street-address-definition',
    type: 'georeference-street-address',
    params: {
        source: georeferenceStreetAddressSource,
        street_address_column: 'street_address'
    }
};

var countriesFromPopulatedPlacesSimpleSource = {
    id: 'countries-from-populated-places-simple-source',
    type: 'source',
    params: {
        query: 'select adm0name as country from populated_places_simple where adm0name = \'Spain\''
    }
};

var georeferenceCountryDefinition = {
    id: 'georeference-country-definition',
    type: 'georeference-country',
    params: {
        source: countriesFromPopulatedPlacesSimpleSource,
        country_column: 'country'
    }
};


var routingToSinglePointDefinition = {
    id: 'routing-to-single-point-example',
    type: 'routing-to-single-point',
    params: {
        source: sourceAtmDef,
        mode: 'car',
        destination_longitude: -3.70237112,
        destination_latitude: 40.41706163,
        units: 'kilometers'
    }
};

var routingSequentialDefinition = {
    id: 'routing-sequential-example',
    type: 'routing-sequential',
    params: {
        source: sourceAtmDef,
        mode: 'car',
        column_target: 'the_geom',
        units: 'kilometers'
    }
};

var routingToLayerAllToAllDefinition = {
    id: 'routing-to-layer-all-to-all-example',
    type: 'routing-to-layer-all-to-all',
    params: {
        source: sourceAtmDef,
        source_column: 'bank',
        target: sourceAtmDef,
        target_column: 'bank',
        mode: 'car',
        units: 'kilometers',
        closest: true
    }
};

var lineToSinglePointDefinition = {
    id: 'line-to-single-point-example',
    type: 'line-to-single-point',
    params: {
        source: sourceAtmDef,
        destination_longitude: -3.66909027,
        destination_latitude: 40.43989237
    }
};

var sourceAtmMachines = {
    type: 'source',
    params: {
        query: 'select * from atm_machines where bank = \'Santander\''
    }
};

var targetAtmMachines = {
    type: 'source',
    params: {
        query: 'select * from atm_machines where bank = \'BBVA\''
    }
};

var lineSourceToTargetDefinition = {
    id: 'line-source-to-target',
    type: 'line-source-to-target',
    params: {
        source: sourceAtmMachines,
        source_column: 'kind',
        target: targetAtmMachines,
        target_column: 'kind',
        closest: false
    }
};

var lineSequentialDefinition = {
    id: 'line-sequential-example',
    type: 'line-sequential',
    params: {
        source: sourceAtmDef
    }
};

var sourceAtmMachinesOffset = {
    type: 'source',
    params: {
        query: 'select * from atm_machines'
    }
};

var lineToColumnDefinition = {
    id: 'line-to-column-example',
    type: 'line-to-column',
    params: {
        source: sourceAtmMachinesOffset,
        target_column: 'the_geom_target'
    }
};

var examples = {
    closest: {
        name: 'closest',
        def: {
            'id': 'closest',
            type: 'closest',
            params: {
                responses: 2,
                // category: 'category',
                source: {
                    id: 'sources',
                    type: 'source',
                    params: {
                        query: [
                            'WITH sources AS (',
                            '   select i as cartodb_id, st_setsrid(st_makepoint(i,0), 4326) as the_geom',
                            '   from generate_series(1,3) as i',
                            ')',
                            'select *, st_x(the_geom) as x, st_y(the_geom) as y from sources'
                        ].join('\n')
                    }
                },
                target: {
                    id: 'targets',
                    type: 'source',
                    params: {
                        query: [
                            'WITH s as (',
                            '   WITH sources AS (',
                            '      select i as cartodb_id, st_setsrid(st_makepoint(i,0), 4326) as the_geom',
                            '      from generate_series(1,3) as i',
                            '   )',
                            '   select *, st_x(the_geom) as x, st_y(the_geom) as y from sources',
                            '),',
                            'targets AS (',
                            'select',
                            '   row_number() over() as cartodb_id,',
                            '   chr(64 + (i % 4)) as category,',
                            '   st_translate(the_geom, 0, i*.1) as the_geom',
                            'from s, generate_series(1,3) as i',
                            ')',
                            'select *, st_x(the_geom) as x, st_y(the_geom) as y from targets'
                        ].join('\n')
                    }
                }
            }
        },
        cartocss: points('green') + labels('category'),
        center: [0, 2],
        zoom: 8,
        debugLayers: [
            {
                type: 'cartodb',
                options: {
                    source: { id: 'sources' },
                    cartocss: points('red'),
                    cartocss_version: '2.3.0',
                    geom_column: 'the_geom',
                    srid: '4326'
                }
            },
            {
                type: 'cartodb',
                options: {
                    source: { id: 'targets' },
                    cartocss: points('ramp([category], cartocolor(Antique), category())'),
                    cartocss_version: '2.3.0',
                    geom_column: 'the_geom',
                    srid: '4326'
                }
            }
        ],
    },
    bounding_circle: {
        name: 'bounding circle populated places',
        def: {
            id: 'boundingCircle',
            type: 'bounding-circle',
            params: {
                source: {
                    type: 'source',
                    params: {
                        query: 'select * from populated_places_simple where adm0_a3 IN (\'ITA\', \'ESP\')'
                    }
                },
                category_column: 'adm0_a3',
                aggregation: 'sum',
                aggregation_column: 'pop_max'
            }
        },
        cartocss:[
            '#layer{',
            '  polygon-fill: ramp([sum_pop_max], colorbrewer(Greens));',
            '  polygon-opacity: 1.0;',
            '}'
        ].join('\n'),
        center: [40.44, -3.7],
        zoom: 3
    },
    bounding_box: {
        name: 'bounding box populated places',
        def: {
            id: 'boundingBox',
            type: 'bounding-box',
            params: {
                source: {
                    type: 'source',
                    params: {
                        query: 'select * from populated_places_simple where adm0_a3 IN (\'ITA\', \'ESP\')'
                    }
                },
                category_column: 'adm0_a3'
            }
        },
        cartocss:[
            '#layer{',
            '  polygon-fill: ramp([count_vals], colorbrewer(Greens));',
            '  polygon-opacity: 1.0;',
            '}'
        ].join('\n'),
        center: [40.44, -3.7],
        zoom: 3
    },
    concave_hull: {
        name: 'concave hull populated places',
        def: {
            id: 'concaveHull',
            type: 'concave-hull',
            params: {
                source: {
                    type: 'source',
                    params: {
                        query: 'select * from populated_places_simple where adm0_a3 IN (\'ITA\', \'ESP\')'
                    }
                },
                allow_holes: true,
                target_percent: 0.85,
                category_column: 'adm0_a3'
            }
        },
        cartocss:[
            '#layer{',
            '  polygon-fill: ramp([count_vals], colorbrewer(Greens));',
            '  polygon-opacity: 1.0;',
            '}'
        ].join('\n'),
        center: [40.44, -3.7],
        zoom: 3
    },
    convex_hull_n: {
        name: 'convex hull for kmeans',
        def: {
            id: 'convexHull',
            type: 'convex-hull',
            params: {
                source: {
                    id: 'kmeans',
                    type: 'kmeans',
                    params:{
                        source: populatedPlacesSource,
                        clusters : 10
                    }
                },
                category_column: 'cluster_no'
            }
        },
        cartocss:[
            '#layer{',
            '  polygon-fill: ramp([count_vals], colorbrewer(Greens));',
            '  polygon-opacity: 0.4;',
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
    centroid: {
        name: 'populated places centroids adm0name',
        def: {
            id: UUID,
            type: 'centroid',
            params: {
                source: {
                    id: 'a0',
                    type: 'source',
                    params: {
                        query: 'select * from populated_places_simple'
                    }
                },
                category_column: 'adm0name'
            }
        },
        dataviews: {},
        filters: {},
        cartocss: CARTOCSS_POINTS + CARTOCSS_LABELS,
        center: [40.44, -3.7],
        zoom: 3
    },
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
        name: 'moran clusters and outliers',
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
    moran_clusters: {
        name: 'moran clusters',
        def: {
            id: 'moran-demo-clusters',
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
                'w_type': 'queen',
                'filters': {
                    outliers_quads: {
                        type: 'category',
                        column: 'quads',
                        params: {
                            accept: ['HH', 'LL']
                        }
                    }
                }
            }
        },
        cartocss: [
            '@HH: #4DB6AC;//light teal',
            '@LL: #FB8C00;//light orange',
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
            '#layer[quads="LL"] {',
            '    polygon-fill: @LL;',
            '}'
        ].join('\n'),
        center: [40.01, -101.16],
        zoom: 4
    },
    moran_outliers: {
        name: 'moran outliers',
        def: {
            id: 'moran-demo-outliers',
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
                'w_type': 'queen',
                'filters': {
                    outliers_quads: {
                        type: 'category',
                        column: 'quads',
                        params: {
                            accept: ['HL', 'LH']
                        }
                    }
                }
            }
        },
        cartocss: [
            '@HL: #00695C;//dark teal',
            '@LH: #d84315;//dark orange',
            '',
            '#layer {',
            '    polygon-opacity: 1;',
            '    line-color: #FFF;',
            '    line-width: 0;',
            '    line-opacity: 1;',
            '}',
            '',
            '#layer[quads="HL"] {',
            '    polygon-fill: @HL;',
            '}',
            '#layer[quads="LH"] {',
            '    polygon-fill: @LH;',
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
    'aggregate-intersection-density': {
        name: 'airbnb and districts aggregate intersection with density',
        def: aggregateIntersectionDensityDefinition,
        cartocss: [
            '#layer{',
            '  polygon-fill: ramp([count_vals_density], colorbrewer(Reds));',
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
    convex_hull: {
        name: 'convex hull for kmeans',
        def: {
            id: 'convexHull',
            type: 'convex-hull',
            params: {
                source: {
                    id: 'kmeans',
                    type: 'kmeans',
                    params:{
                        source: populatedPlacesSource,
                        clusters : 10
                    }
                },
                category_column: 'cluster_no'
            }
        },
        cartocss:[
            '#layer{',
            '  polygon-fill: red;',
            '  polygon-opacity: 0.4;',
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
    weighted_centroid_polygons_builder: {
        name: 'weighted-centroid populated places buffer',
        def: {
            id: 'weightedCentroid',
            type: 'weighted-centroid',
            params:{
                source: {
                    id: 'BUFFER',
                    type: 'buffer',
                    params:{
                        source: {
                            id: 'kmeans',
                            type: 'kmeans',
                            params:{
                                source: populatedPlacesSource,
                                clusters: 10
                            }
                        },
                        radius: 100000
                    }
                },
                weight_column: 'pop_max',
                category_column: 'cluster_no'
            }
        },
        cartocss: CARTOCSS_POINTS,
        center: [40.44, -3.7],
        zoom: 3
    },
    weighted_centroid_aggregation_function: {
        name: 'weighted-centroid populated places aggregation',
        def: {
            id: 'weightedCentroid',
            type: 'weighted-centroid',
            params:{
                source: {
                    id: 'kmeans',
                    type: 'kmeans',
                    params:{
                        source: populatedPlacesSource,
                        clusters : 5
                    }
                },
                weight_column: 'pop_max',
                category_column: 'cluster_no',
                aggregation: 'sum',
                aggregation_column: 'pop_max'
            }
        },
        cartocss:[
            '#layer {',
            '  marker-fill: red;',
            '  marker-line-width: 0.5;',
            '  marker-allow-overlap: true;',
            '  marker-width: 48;',
            '}',
            '#layer::labels {',
            '    text-size: 12;',
            '    text-fill: #fff;',
            '    text-opacity: 0.8;',
            '    text-name: [value];',
            '    text-face-name: \'DejaVu Sans Book\';',
            '    text-halo-fill: #FFF;',
            '    text-halo-radius: 0.5;',
            '    text-allow-overlap: true;',
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
    builder_intersection: {
        name: '[builder] airbnb and districts intersection',
        def: {
            id: 'intersection-example-1',
            type: 'intersection',
            params: {
                source: {
                    id: 'barrios-source',
                    type: 'source',
                    params: {
                        query: 'select * from barrios'
                    }
                },
                target: {
                    id: 'airbnb-source',
                    type: 'source',
                    params: {
                        query: 'select * from airbnb_madrid_oct_2015_listings'
                    }
                }
            }
        },
        cartocss: CARTOCSS_POINTS + '\n' + [
            '#categories {',
            '  marker-fill: ramp([source_nombre], colorbrewer(Paired, 7), category);',
            '}'
        ].join('\n'),
        center: [40.44, -3.7],
        zoom: 12
    },
    builder_aggregate_intersection: {
        name: '[builder] airbnb and districts intersection with avg price aggregation',
        def: {
            id: 'aggregate-intersection-example-1',
            type: 'aggregate-intersection',
            params: {
                source: {
                    id: 'barrios-source',
                    type: 'source',
                    params: {
                        query: 'select * from barrios'
                    }
                },
                target: {
                    id: 'airbnb-source',
                    type: 'source',
                    params: {
                        query: 'select * from airbnb_madrid_oct_2015_listings'
                    }
                },
                aggregate_function: 'avg',
                aggregate_column: 'price'
            }
        },
        cartocss: CARTOCSS_POLYGONS + '\n' + [
            '#polygon {',
            '  polygon-fill: ramp([avg_price], colorbrewer(Reds));',
            '}'
        ].join('\n'),
        center: [40.44, -3.7],
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
    weighted_centroid_populated_builder_linked_by_lines: {
        name: 'populated places clusters linked by lines',
        def: {
            id: 'linkedByLines',
            type: 'link-by-line',
            params: {
                source_points: {
                    id: 'kmeans-s',
                    type: 'kmeans',
                    params: {
                        source: populatedPlacesSource,
                        clusters : 5
                    }
                },
                destination_points: {
                    id: 'weightedCentroid',
                    type: 'weighted-centroid',
                    params:{
                        source: {
                            id: 'kmeans',
                            type: 'kmeans',
                            params:{
                                source: populatedPlacesSource,
                                clusters : 5
                            }
                        },
                        weight_column: 'pop_max',
                        category_column: 'cluster_no'
                    }
                },
                source_column: 'cluster_no',
                destination_column: 'category'
            }
        },
        cartocss: CARTOCSS_LINES,
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
            },
            {
                type: 'cartodb',
                options: {
                    source: { id: 'weightedCentroid' },
                    cartocss: [
                        '#layer{',
                        '  marker-fill: red;',
                        '  marker-line-width: 0.5;',
                        '  marker-allow-overlap: true;',
                        '  marker-width: 96.0;',
                        '}'
                    ].join('\n'),
                    cartocss_version: '2.3.0'
                }
            }
        ],
        center: [40.44, -3.7],
        zoom: 3
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
    filter_rank: {
        name: 'populated places filter rank',
        def: {
            id: UUID,
            type: 'filter-rank',
            params: {
                source: {
                    id: 'a0',
                    type: 'source',
                    params: {
                        query: 'select * from populated_places_simple'
                    }
                },
                column: 'pop_max',
                rank: 'top',
                limit: 10
            }
        },
        dataviews: {},
        filters: {},
        cartocss: CARTOCSS_POINTS,
        center: [40.44, -3.7],
        zoom: 3
    },
    filter_grouped_rank: {
        name: 'city most populated by country (filter grouped rank)',
        def: {
            id: UUID,
            type: 'filter-grouped-rank',
            params: {
                source: {
                    id: 'a0',
                    type: 'source',
                    params: {
                        query: 'select * from populated_places_simple'
                    }
                },
                column: 'pop_max',
                rank: 'top',
                group: 'iso_a2',
                max: 1
            }
        },
        dataviews: {},
        filters: {},
        cartocss: CARTOCSS_POINTS,
        center: [40.44, -3.7],
        zoom: 3
    },
    merge: {
        name: 'merge populated + world borders',
        def: {
            id: 'merge-example',
            type: 'merge',
            params: {
                left_source: {
                    id: 'even-barrios-source',
                    type: 'source',
                    params: {
                        query: 'select * from populated_places_simple_reduced'
                    }
                },
                right_source: {
                    id: 'world-borders',
                    type: 'source',
                    params: {
                        query: 'select * from world_borders_hd where admin != \'Antarctica\''
                    }
                },
                left_source_column: 'adm0_a3',
                right_source_column: 'adm0_a3',
                join_operator: 'inner',
                source_geometry: 'left_source',
                right_source_columns: ['pop_est', 'gdp_md_est']
            }
        },
        cartocss: CARTOCSS_POINTS,
        center: [40.44, -3.7],
        zoom: 3
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
    },
    'georeference-admin_region': {
       name: 'georeferencing admin regions',
       def: georeferenceAdminRegionDefinition,
       cartocss: [
           '#layer{',
           '  polygon-fill: #FABADA;',
           '  polygon-opacity: 0.6;',
           '  polygon-opacity: 0.7;',
           '  line-color: #FFF;',
           '  line-width: 0.5;',
           '  line-opacity: 1;',
           '}'
       ].join('\n'),
       center: [40.44, -3.7],
       zoom: 6
    },
    'georeference-city': {
        name: 'georeferencing cities',
        def: georeferenceCityDefinition,
        cartocss: [
            '#layer{',
            '   marker-fill-opacity: 0.9;',
            '   marker-line-color: #FFF;',
            '   marker-line-width: 1;',
            '   marker-line-opacity: 1;',
            '   marker-placement: point;',
            '   marker-type: ellipse;',
            '   marker-width: 10;',
            '   marker-fill: #FF6600;',
            '   marker-allow-overlap: true;',
            '}'
        ].join('\n'),
        center: [40.44, -3.7],
        zoom: 6
    },
    'georeference-ip-address': {
        name: 'georeferencing ip addresses',
        def: georeferenceIpAddressDefinition,
        cartocss: [
            '#layer{',
            '   marker-fill-opacity: 0.9;',
            '   marker-line-color: #FFF;',
            '   marker-line-width: 1;',
            '   marker-line-opacity: 1;',
            '   marker-placement: point;',
            '   marker-type: ellipse;',
            '   marker-width: 10;',
            '   marker-fill: #FF6600;',
            '   marker-allow-overlap: true;',
            '}'
        ].join('\n'),
        center: [40.44, -3.7],
        zoom: 6
    },
    'georeference-long-lat': {
        name: 'georeferencing longitude latitude coordinates',
        def: georeferenceLongLatDefinition,
        cartocss: [
            '#layer{',
            '   marker-fill-opacity: 0.9;',
            '   marker-line-color: #FFF;',
            '   marker-line-width: 1;',
            '   marker-line-opacity: 1;',
            '   marker-placement: point;',
            '   marker-type: ellipse;',
            '   marker-width: 10;',
            '   marker-fill: #FF6600;',
            '   marker-allow-overlap: true;',
            '}'
        ].join('\n'),
        center: [40.44, -3.7],
        zoom: 12
    },
    'georeference-postal-code': {
       name: 'georeferencing postal codes',
       def: georeferencePostalCodeDefinition,
       cartocss: [
           '#layer{',
           '  polygon-fill: #FABADA;',
           '  polygon-opacity: 0.6;',
           '  polygon-opacity: 0.7;',
           '  line-color: #FFF;',
           '  line-width: 0.5;',
           '  line-opacity: 1;',
           '}'
       ].join('\n'),
       center: [40.44, -3.7],
       zoom: 6
   },
   'georeference-street-address': {
       name: 'georeferencing street addresses',
       def: georeferenceStreetAddressDefinition,
       cartocss: [
           '#layer{',
           '   marker-fill-opacity: 0.9;',
           '   marker-line-color: #FFF;',
           '   marker-line-width: 1;',
           '   marker-line-opacity: 1;',
           '   marker-placement: point;',
           '   marker-type: ellipse;',
           '   marker-width: 10;',
           '   marker-fill: #FF6600;',
           '   marker-allow-overlap: true;',
           '}'
       ].join('\n'),
       center: [40.44, -3.7],
       zoom: 6
   },
   'georeference-country': {
       name: 'georeferencing country',
       def: georeferenceCountryDefinition,
       cartocss: [
           '#layer{',
           '   marker-fill-opacity: 0.9;',
           '   marker-line-color: #FFF;',
           '   marker-line-width: 1;',
           '   marker-line-opacity: 1;',
           '   marker-placement: point;',
           '   marker-type: ellipse;',
           '   marker-width: 10;',
           '   marker-fill: #FF6600;',
           '   marker-allow-overlap: true;',
           '}'
       ].join('\n'),
       center: [40.44, -3.7],
       zoom: 6
   },
   'routing-to-single-point': {
       name: 'routing to a single point',
       def: routingToSinglePointDefinition,
       cartocss: [
           '#layer{',
           '  line-color: #FABADA;',
           '  line-width: 2;',
           '  line-opacity: 0.7;',
           '}'
       ].join('\n'),
       center: [40.44, -3.7],
       zoom: 12
   },
   'routing-sequential': {
       name: 'routing with sequential',
       def: routingSequentialDefinition,
       cartocss: [
           '#layer{',
           '  line-color: #F42220;',
           '  line-width: 2;',
           '  line-opacity: 0.7;',
           '}'
       ].join('\n'),
       center: [40.44, -3.7],
       zoom: 12
   },
   'routing-to-layer-all-to-all': {
        name: 'routing to layer all to all',
        def: routingToLayerAllToAllDefinition,
        cartocss: [
            '#layer{',
            '  line-color: #F42220;',
            '  line-width: 2;',
            '  line-opacity: 0.7;',
            '}'
        ].join('\n'),
        center: [40.44, -3.7],
        zoom: 12
    },
    'line-to-single-point': {
        name: 'lines to a single point',
        def: lineToSinglePointDefinition,
        cartocss: [
            '#layer{',
            '  line-color: #FABADA;',
            '  line-width: 2;',
            '  line-opacity: 0.7;',
            '}'
        ].join('\n'),
        center: [40.44, -3.7],
        zoom: 12
    },
    'line-source-to-target-all': {
         name: 'lines source to target',
         def: lineSourceToTargetDefinition,
         cartocss: [
             '#layer{',
             '  line-color: #F42220;',
             '  line-width: 2;',
             '  line-opacity: 0.7;',
             '}'
         ].join('\n'),
         center: [40.44, -3.7],
         zoom: 12
     },
    'line-sequential': {
        name: 'line sequential',
        def: lineSequentialDefinition,
        cartocss: [
            '#layer{',
            '  line-color: #F42220;',
            '  line-width: 2;',
            '  line-opacity: 0.7;',
            '}'
        ].join('\n'),
        center: [40.44, -3.7],
        zoom: 12
    },
    'line-to-column': {
        name: 'line to column',
        def: lineToColumnDefinition,
        cartocss: [
            '#layer{',
            '  line-color: #F42220;',
            '  line-width: 2;',
            '  line-opacity: 0.7;',
            '}'
        ].join('\n'),
        center: [ 40.7246183, -3.1864915 ],
        zoom: 9
    }
};
