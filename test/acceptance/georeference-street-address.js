'use strict';

var assert = require('assert');
var testHelper = require('../helper');

describe('georeference-street-address analysis', function() {

    function quoteColumn(address, column) {
        return '\'' + address[column] + '\'::text AS ' + column;
    }

    function addressSourceNode(address) {
        address = address || {};
        var columns = ['1 as cartodb_id'].concat(Object.keys(address).map(function(column) {
            return quoteColumn(address, column);
        }));
        return {
            type: 'source',
            params: {
                query: 'SELECT ' + columns.join(', ')
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
                source: addressSourceNode({street_name: ''})
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
            addressNode: addressSourceNode({
                street_name: 'W 26th Street'
            }),
            column: 'street_name',
            x: -74.990425,
            y: 40.744131
        },
        {
            desc: 'basic template',
            addressNode: addressSourceNode({
                street_name: 'W 26th Street'
            }),
            template: '{{street_name}}',
            x: -74.990425,
            y: 40.744131
        },
        {
            desc: 'template with two columns',
            addressNode: addressSourceNode({
                city: 'Madrid',
                country: 'Spain'
            }),
            template: '{{city}}, {{country}}',
            x: -3.669245,
            y: 40.429913
        },
        {
            desc: 'template with column and free text',
            addressNode: addressSourceNode({
                city: 'Logroño'
            }),
            template: '{{city}}, Argentina',
            x: -61.69614,
            y: -29.50347
        },
        {
            desc: 'template with spaces in token',
            addressNode: addressSourceNode({
                city: 'Logroño'
            }),
            template: '{{ city }}, Argentina',
            x: -61.69614,
            y: -29.50347
        },
        {
            desc: 'with column and more free text',
            addressNode: addressSourceNode({
                city: 'Logroño'
            }),
            template: '{{city}}, La Rioja, Spain',
            x: -2.517555,
            y: 42.302939
        },
        {
            desc: 'with several columns and free text',
            addressNode: addressSourceNode({
                city: 'Logroño',
                state: 'La Rioja'
            }),
            template: '{{city}}, {{state}}, Spain',
            x: -2.517555,
            y: 42.302939
        },
        {
            desc: 'with only free text',
            addressNode: addressSourceNode(),
            template: 'Logroño, La Rioja, Spain',
            x: -2.517555,
            y: 42.302939
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
                    source: scenario.addressNode
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
                    assert.equal(rows.length, 1);
                    var row = rows[0];

                    assert.notEqual(row.x, 0, 'X coordinate should not be default=0. Review your scenario.');
                    assert.notEqual(row.y, 0, 'Y coordinate should not be default=0. Review your scenario.');

                    assert.equal(row.x, scenario.x);
                    assert.equal(row.y, scenario.y);

                    return done();
                });
            });
        });
    });

});
