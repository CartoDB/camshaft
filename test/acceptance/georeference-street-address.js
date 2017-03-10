'use strict';

var assert = require('assert');
var testHelper = require('../helper');

describe('georeference-street-address analysis', function() {
    var QUERY_SOURCE = [
        'SELECT',
        '    row_number() OVER (ORDER BY x ASC) AS cartodb_id,',
        '    \'street_name_\' || x::text as street_name,',
        '    \'street_type_\' || x::text as street_type,',
        '    \'street_number_\' || x::text as street_number,',
        '    \'city_\' || x::text as city,',
        '    \'state_\' || x::text  as state,',
        '    st_setsrid(st_makepoint(10 * x, 10 * x), 4326) as the_geom,',
        '    st_transform(st_setsrid(st_makepoint(10 * x, 10 * x), 4326), 3857) as the_geom_webmercator',
        'FROM generate_series(1,5) x'
    ].join('\n');

    var addresses = {
        type: 'source',
        params: {
            query: QUERY_SOURCE
        }
    };

    it('should create analysis georeference street address with multiple street columns', function (done) {
        var georeferenceStreetAddressDefinition = {
            type: 'georeference-street-address',
            params: {
                source: addresses,
                street_address_columns: ['street_type', 'street_name', 'street_number'],
                city_column: 'city',
                state_column: 'state',
                country: 'Spain'
            }
        };

        testHelper.createAnalyses(georeferenceStreetAddressDefinition, function(err, georeferenceStreetAddress) {
            assert.ifError(err);

            var rootNode = georeferenceStreetAddress.getRoot();

            testHelper.getRows(rootNode.getQuery(), function(err, rows) {
                assert.ifError(err);

                rows.forEach(function(row) {
                    assert.ok(typeof row.cartodb_id === 'number');
                    assert.ok(typeof row.the_geom === 'string');
                });

                return done();
            });
        });
    });

    it('should create analysis georeference street address with one street column', function (done) {
        var georeferenceStreetAddressDefinition = {
            type: 'georeference-street-address',
            params: {
                source: addresses,
                street_address_columns: ['street_name'],
                city_column: 'city',
                state_column: 'state',
                country: 'Spain'
            }
        };

        testHelper.createAnalyses(georeferenceStreetAddressDefinition, function(err, georeferenceStreetAddress) {
            assert.ifError(err);

            var rootNode = georeferenceStreetAddress.getRoot();

            testHelper.getRows(rootNode.getQuery(), function(err, rows) {
                assert.ifError(err);

                rows.forEach(function(row) {
                    assert.ok(typeof row.cartodb_id === 'number');
                    assert.ok(typeof row.the_geom === 'string');
                });

                return done();
            });
        });
    });

    it('georeference street address w/o street column should return error', function (done) {
        var georeferenceStreetAddressDefinition = {
            type: 'georeference-street-address',
            params: {
                source: addresses,
            }
        };

        testHelper.createAnalyses(georeferenceStreetAddressDefinition, function(err) {
            assert.ok(err.message.match(/Missing required param/));
            done();
        });
    });
});
