'use strict';

var assert = require('assert');
var testHelper = require('../helper');

describe('georeference-street-address analysis', function() {

    function quoteColumn(address, column) {
        var value = address[column];
        if(typeof value !== 'number') {
            value = '\'' + value + '\'::text ';
        }
        return value + ' AS ' + column;
    }

    function addressQuery(address) {
        address = address || {};
        if(!address.cartodb_id) {
            address.cartodb_id = 1;
        }
        var columns = Object.keys(address).map(function (column) {
            return quoteColumn(address, column);
        });
        return 'SELECT ' + columns.join(', ');
    }

    function addressesQuery(addressRows) {
        var addressesQueries = addressRows.map((row) => addressQuery(row));
        return 'select * from (' + addressesQueries.join(' union all ') + ') aqua';
    }

    function addressSourceNode(query) {
        return {
            type: 'source',
            params: {
                query: query
            }
        };
    }

    function wrapQueryWithXY(node) {
        return [
            'SELECT *, ST_X(the_geom) AS x, ST_Y(the_geom) AS Y FROM (',
            node.getQuery(),
            ') _q'
        ].join('');
    }

    it('should check either street_address_column or street_address_column are provided', function (done) {
        var georeferenceStreetAddressDefinition = {
            type: 'georeference-street-address',
            params: {
                source: addressSourceNode(addressQuery({street_name: ''}))
            }
        };
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
            addresses: [{
                city: 'Madrid',
                country: 'Spain',
                point: {
                    x: -3.669245,
                    y: 40.429913
                }
            }]
        },
        {
            desc: 'template with column and free text',
            template: '{{city}}, Argentina',
            addresses: [{
                city: 'Logroño',
                point: {
                    x: -61.69614,
                    y: -29.50347
                }
            }],
        },
        {
            desc: 'template with spaces in token',
            template: '{{ city }}, Argentina',
            addresses: [{
                city: 'Logroño',
                point: {
                    x: -61.69614,
                    y: -29.50347
                }
            }],
        },
        {
            desc: 'with column and more free text',
            template: '{{city}}, La Rioja, Spain',
            addresses: [{
                city: 'Logroño',
                point: {
                    x: -2.517555,
                    y: 42.302939
                }
            }]
        },
        {
            desc: 'with several columns and free text',
            template: '{{city}}, {{state}}, Spain',
            addresses: [{
                city: 'Logroño',
                state: 'La Rioja',
                point: {
                    x: -2.517555,
                    y: 42.302939
                }
            }]
        },
        {
            desc: 'with only free text',
            template: 'Logroño, La Rioja, Spain',
            addresses: [{
                point: {
                    x: -2.517555,
                    y: 42.302939
                }
            }]
        },
        {
            desc: 'multiple rows',
            addresses: [
                {
                    cartodb_id: 1,
                    street_name: 'W 26th Street',
                    point:
                        {
                            x: -74.990425,
                            y: 40.744131
                        }
                },
                {
                    cartodb_id: 2,
                    street_name: '1900 amphitheatre parkway, mountain view, ca, us',
                    point:
                        {
                            x: -122.0875324,
                            y: 37.4227968
                        }
                }
            ],
            column: 'street_name'
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
            var definition = {
                type: 'georeference-street-address',
                params: {
                    source: addressSourceNode(addressesQuery(scenario.addresses))
                }
            };

            if (scenario.column) {
                definition.params.street_address_column = scenario.column;
            } else if (scenario.template) {
                definition.params.street_address_template = scenario.template;
            } else {
                return done(new Error('Test scenario is missing `column` and `template`'));
            }

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

                        assert.equal(row.x, address.point.x);
                        assert.equal(row.y, address.point.y);

                        if(row.street_name) {
                            assert.equal(row.street_name, address.street_name);
                        }
                    }

                    return done();
                });
            });
        });
    });

});
