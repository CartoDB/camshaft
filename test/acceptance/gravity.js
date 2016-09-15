'use strict';

var assert = require('assert');
var testHelper = require('../helper');

describe('gravity analysis', function () {

    var sourceAtmMachines = {
        type: 'source',
        params: {
            query: 'select * from atm_machines limit 2'
        }
    };

    var targetAtmMachines = {
        type: 'source',
        params: {
            query: 'select * from atm_machines limit 2 offset 2'
        }
    };

    describe('gravity', function () {

        var node_definition = {
            type: 'gravity',
            params: {
                source: sourceAtmMachines,
                target: targetAtmMachines,
                weight_column: 'cartodb_id',
                pop_column: 'cartodb_id',
                max_distance: 500,
                target_id: 1
            }
        };

        it('should create analysis', function (done) {
            testHelper.createAnalyses(node_definition, function (err, gravity) {

                assert.ifError(err);

                var rootNode = gravity.getRoot();

                testHelper.getRows(rootNode.getQuery(), function (err, rows) {
                    assert.ifError(err);
                    rows.forEach(function (row) {
                        assert.ok(typeof row.cartodb_id === 'number');
                        assert.ok(typeof row.the_geom === 'string');
                    });
                    return done();
                });
            });
        });

    });
});
