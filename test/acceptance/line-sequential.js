'use strict';

var assert = require('assert');
var testHelper = require('../helper');

describe('line-sequential analysis', function() {
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
            testHelper.createAnalyses(lineSequentialDefinition, function(err, analysis) {
                assert.ok(!err, err);
                testHelper.getRows(analysis.getQuery(), function(err, rows) {
                    assert.ok(!err, err);
                    assert.ok(rows);
                    assert.equal(rows.length, 1);
                    rows.forEach(function (row) {
                        assert.equal(typeof row.cartodb_id, 'number');
                        assert.ok(row.the_geom);
                        assert.ok(row.length);
                    });

                    done();
                });
            });
        });

        it('should create analysis sequential order by bank asc', function (done) {
            lineSequentialDefinition.params.order_type = 'asc';
            testHelper.createAnalyses(lineSequentialDefinition, function(err, analysis) {
                assert.ok(!err, err);
                testHelper.getRows(analysis.getQuery(), function(err, rows) {
                    assert.ok(!err, err);
                    assert.ok(rows);
                    assert.equal(rows.length, 1);
                    rows.forEach(function (row) {
                        assert.equal(typeof row.cartodb_id, 'number');
                        assert.ok(row.the_geom);
                        assert.ok(row.length);
                    });
                    done();
                });
            });
        });

        it('should create analysis sequential order by cartodb_id (by default) asc', function (done) {
            lineSequentialDefinition.params.order_column = undefined;
            testHelper.createAnalyses(lineSequentialDefinition, function(err, analysis) {
                assert.ok(!err, err);
                testHelper.getRows(analysis.getQuery(), function(err, rows) {
                    assert.ok(!err, err);
                    assert.ok(rows);
                    assert.equal(rows.length, 1);
                    rows.forEach(function (row) {
                        assert.equal(typeof row.cartodb_id, 'number');
                        assert.ok(row.the_geom);
                        assert.ok(row.length);
                    });
                    done();
                });
            });
        });

        it('should create analysis sequential grouped by `kind`', function (done) {
            lineSequentialDefinition.params.order_column = undefined;
            lineSequentialDefinition.params.category_column = 'kind';

            testHelper.createAnalyses(lineSequentialDefinition, function(err, analysis) {
                assert.ok(!err, err);
                testHelper.getRows(analysis.getQuery(), function(err, rows) {
                    assert.ok(!err, err);
                    assert.ok(rows);
                    assert.equal(rows.length, 2);
                    rows.forEach(function (row) {
                        assert.equal(typeof row.cartodb_id, 'number');
                        assert.ok(row.the_geom);
                        assert.ok(row.length);
                    });
                    done();
                });
            });
        });

        it('should create analysis sequential grouped by `kind` and ordered by bank asc', function (done) {
            lineSequentialDefinition.params.order_type = 'asc';
            lineSequentialDefinition.params.category_column = 'kind';
            testHelper.createAnalyses(lineSequentialDefinition, function(err, analysis) {
                assert.ok(!err, err);
                testHelper.getRows(analysis.getQuery(), function(err, rows) {
                    assert.ok(!err, err);
                    assert.ok(rows);
                    assert.equal(rows.length, 2);
                    rows.forEach(function (row) {
                        assert.equal(typeof row.cartodb_id, 'number');
                        assert.ok(row.the_geom);
                        assert.ok(row.category);
                        assert.ok(row.length);
                    });
                    done();
                });
            });
        });
    });
});
