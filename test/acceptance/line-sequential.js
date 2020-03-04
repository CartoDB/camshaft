'use strict';

var assert = require('assert');
var testHelper = require('../helper');

describe('line-sequential analysis', function () {
    var QUERY_SOURCE = 'select * from atm_machines';
    var sourceAtmMachines = {
        type: 'source',
        params: {
            query: QUERY_SOURCE
        }
    };

    describe('line sequential analysis', function () {
        var lineSequentialDefinition = {
            type: 'line-sequential',
            params: {
                source: sourceAtmMachines,
                order_column: 'bank',
                order_type: 'desc'
            }
        };

        it('should create analysis sequential order by bank desc', function (done) {
            testHelper.createAnalyses(lineSequentialDefinition, function (err, lineSequential) {
                assert.ifError(err);

                var rootNode = lineSequential.getRoot();

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

        it('should create analysis sequential order by bank asc', function (done) {
            lineSequentialDefinition.params.order_type = 'asc';
            testHelper.createAnalyses(lineSequentialDefinition, function (err, lineSequential) {
                assert.ifError(err);

                var rootNode = lineSequential.getRoot();

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

        it('should return error: missing required param "order_column"', function (done) {
            lineSequentialDefinition.params.order_column = undefined;
            testHelper.createAnalyses(lineSequentialDefinition, function (err) {
                assert.ok(err);
                assert.equal(err.message, 'Missing required param "order_column"');
                return done();
            });
        });

        it('should return error: missing required param "order_column"', function (done) {
            lineSequentialDefinition.params.order_column = 'bank';
            lineSequentialDefinition.params.order_type = undefined;
            testHelper.createAnalyses(lineSequentialDefinition, function (err) {
                assert.ok(err);
                assert.equal(err.message, 'Missing required param "order_type"');
                return done();
            });
        });
    });
});
