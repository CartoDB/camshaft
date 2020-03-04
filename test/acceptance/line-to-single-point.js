'use strict';

var assert = require('assert');
var testHelper = require('../helper');

describe('line-to-single-point analysis', function () {
    var QUERY = 'select * from atm_machines limit 2';

    var sourceAtmMachines = {
        type: 'source',
        params: {
            query: QUERY
        }
    };

    describe('line to single point analysis', function () {
        var lineToSinglePointDefinition = {
            type: 'line-to-single-point',
            params: {
                source: sourceAtmMachines,
                destination_longitude: -3.66909027,
                destination_latitude: 40.43989237
            }
        };

        it('should create analysis', function (done) {
            testHelper.createAnalyses(lineToSinglePointDefinition, function (err, lineToSinglePoint) {
                assert.ifError(err);

                var rootNode = lineToSinglePoint.getRoot();

                testHelper.getRows(rootNode.getQuery(), function (err, rows) {
                    assert.ifError(err);
                    rows.forEach(function (row) {
                        assert.ok(typeof row.cartodb_id === 'number');
                        assert.ok(typeof row.the_geom === 'string');
                        assert.ok(typeof row.length === 'number');
                    });

                    return done();
                });
            });
        });
    });
});
