'use strict';

var assert = require('assert');
var testHelper = require('../helper');

describe('georeference-street-address analysis', function() {

    function georeferenceStreetAddressNode(query, streetColumn, template, extraParams) {
        const definition = {
            type: 'georeference-street-address',
            params: {
                source: {
                    type: 'source',
                    params: {
                        query: query
                    }
                },
                street_address_column: streetColumn,
                street_address_template: template
            }
        };

        Object.assign(definition.params, extraParams);

        return definition;
    }

    function wrapQueryWithXY(node) {
        return `
            SELECT *, ST_X(the_geom) AS x, ST_Y(the_geom) AS Y
            FROM (
                ${node.getQuery()}
            ) _q`;
    }

    it('should check either street_address_column or street_address_template are provided', function (done) {
        var georeferenceStreetAddressDefinition = georeferenceStreetAddressNode('select 1 as cartodb_id', null);
        testHelper.createAnalyses(georeferenceStreetAddressDefinition, function(err) {
            assert.ok(err);
            assert.equal(
                err.message,
                'Either `street_address_column` or `street_address_template` params must be provided'
            );
            done();
        });
    });

    var scenarios = [
        {
            desc: 'column',
            column: 'street_name',
            query: 'select * from georeference_street_address_fixture where cartodb_id = 1',
            addresses: [{
                street_name: 'W 26th Street',
                point: {
                    x: -74.990425,
                    y: 40.744131
                }
            }]
        },
        {
            desc: 'basic template',
            template: '{{street_name}}',
            query: 'select * from georeference_street_address_fixture where cartodb_id = 1',
            addresses: [{
                street_name: 'W 26th Street',
                point: {
                    x: -74.990425,
                    y: 40.744131
                }
            }]
        },
        {
            desc: 'template with two columns',
            template: '{{city}}, {{country}}',
            query: 'select * from georeference_street_address_fixture where cartodb_id = 6',
            addresses: [{
                street_name: 'Logroño',
                city: 'Logroño',
                country: 'Spain',
                point: {
                    x: -2.517555,
                    y: 42.302939
                }
            }]
        },
        {
            desc: 'template with columns without all commas',
            template: 'Paseo Zorrilla {{cartodb_id}}, Valladolid, Spain',
            query: 'select * from georeference_street_address_fixture where cartodb_id between 1 and 3',
            addresses: [
                { point: { x: -61.1, y: -29.1 } },
                { point: { x: -61.2, y: -29.2 } },
                { point: { x: -61.3, y: -29.3 } }
            ]
        },
        {
            desc: 'template with two columns without commas',
            template: '{{street_name}} {{street_number}}, {{city}}, Spain',
            query: 'select * from georeference_street_address_fixture where cartodb_id between 8 and 10',
            addresses: [
                { point: { x: -61.1, y: -29.1 } },
                { point: { x: -61.2, y: -29.2 } },
                { point: { x: -61.3, y: -29.3 } }
            ]
        },
        {
            desc: 'template with column and free text',
            template: '{{city}}, Spain',
            query: 'select * from georeference_street_address_fixture where cartodb_id = 6',
            addresses: [{
                street_name: 'Logroño',
                city: 'Logroño',
                point: {
                    x: -2.517555,
                    y: 42.302939
                },
            }],
        },
        {
            desc: 'template with spaces in token',
            template: '{{ city  }}, La Rioja, Spain',
            query: 'select * from georeference_street_address_fixture where cartodb_id = 6',
            addresses: [{
                street_name: 'Logroño',
                city: 'Logroño',
                point: {
                    x: -2.517555,
                    y: 42.302939
                },
            }],
        },
        {
            desc: 'with column and more free text',
            template: '{{city}}, La Rioja, Spain',
            query: 'select * from georeference_street_address_fixture where cartodb_id = 6',
            addresses: [{
                street_name: 'Logroño',
                city: 'Logroño',
                point: {
                    x: -2.517555,
                    y: 42.302939
                },
            }]
        },
        {
            desc: 'with several columns and free text',
            template: '{{city}}, {{state}}, Spain',
            query: 'select * from georeference_street_address_fixture where cartodb_id = 4',
            addresses: [{
                point: {
                    x: -2.517555,
                    y: 42.302939
                }
            }]
        },
        {
            desc: 'with only free text',
            template: 'Logroño, La Rioja, Spain',
            query: 'select * from georeference_street_address_fixture where cartodb_id = 1',
            addresses: [
                { cartodb_id: 1, point: { x: -2.517555, y: 42.302939 }, street_name: 'W 26th Street' }
            ]
        },
        {
            desc: 'multiple rows',
            column: 'full_address',
            query: 'select * from georeference_street_full_address_fixture order by cartodb_id',
            addresses: [
                { cartodb_id: 1, point: { x: -74.990425, y: 40.744131 }, street_name: 'W 26th Street' },
                { cartodb_id: 2, point: { x: -3.669245, y: 40.429913 }, street_name: 'Puerta del Sol' },
                { cartodb_id: 3, point: { x: -61.69614, y: -29.50347 }, street_name: 'Plaza Mayor' },
                { cartodb_id: 4, point: { x: -61.69614, y: -29.50347 }, street_name: 'Logroño' },
                { cartodb_id: 5, point: { x: -122.0875324, y: 37.4227968 }, street_name: '1900 amphiteatre parkway' }
            ]
        },
        {
            desc: 'column literals',
            column: 'street_name',
            query: 'select * from georeference_street_address_fixture where cartodb_id = 7',
            params: {
                city: 'Valladolid',
                country_column: 'country'
            },
            addresses: [
                { cartodb_id: 1, point: { x: -61.666, y: -29.555 }, street_name: 'Plaza Mayor' }
            ]
        }
    ];

    scenarios.forEach(function(scenario) {
        var testFn = it;
        if (scenario.test === 'skip') {
            testFn = it.skip;
        }
        if (scenario.test === 'only') {
            testFn = it.only;
        }

        testFn('should work from ' + scenario.desc, function (done) {
            var definition = georeferenceStreetAddressNode(scenario.query,
                scenario.column, scenario.template, scenario.params);

            testHelper.createAnalyses(definition, function(err, result) {
                assert.ifError(err);

                var rootNode = result.getRoot();

                testHelper.getRows(wrapQueryWithXY(rootNode), function(err, rows) {
                    assert.ifError(err);
                    assert.equal(rows.length, scenario.addresses.length);
                    for(let i = 0; i < rows.length; i++) {
                        const row = rows[i];
                        const address = scenario.addresses[i];

                        assert.notEqual(row.x, 0, 'X coordinate should not be default=0. Review your scenario.');
                        assert.notEqual(row.y, 0, 'Y coordinate should not be default=0. Review your scenario.');

                        assert.equal(row.x, address.point.x, row.x + ' != ' + address.point.x + ' at ' + i);
                        assert.equal(row.y, address.point.y);

                        if(row.street_name && address.street_name) {
                            assert.equal(row.street_name, address.street_name);
                        }

                        assert.equal(row.__geocoding_meta_relevance, 1);
                        assert.equal(row.__geocoding_meta_precision, 'precise');
                        assert.equal(row.__geocoding_meta_match_types.length, 1);
                        assert.equal(row.__geocoding_meta_match_types[0], 'locality');
                    }

                    return done();
                });
            });
        });
    });

});
