'use strict';

var assert = require('assert');
var testHelper = require('../helper');

describe('line-source-to-target analysis', function() {
    var QUERY_SOURCE = 'select * from atm_machines where bank = \'Santander\'';
    var sourceAtmMachines = {
        type: 'source',
        params: {
            query: QUERY_SOURCE
        }
    };

    var QUERY_TARGET = 'select * from atm_machines where bank = \'BBVA\'';
    var targetAtmMachines = {
        type: 'source',
        params: {
            query: QUERY_TARGET
        }
    };

    describe('line source to target analysis', function () {
        var lineToLayerAllToAllDefinition = {
            type: 'line-source-to-target',
            params: {
                source: sourceAtmMachines,
                source_column: 'kind',
                target: targetAtmMachines,
                target_column: 'kind',
                closest: false
            }
        };

        it('should create analysis joined by kind', function (done) {
            testHelper.createAnalyses(lineToLayerAllToAllDefinition, function(err, lineToLayerAllToAll) {
                assert.ifError(err);

                var rootNode = lineToLayerAllToAll.getRoot();

                testHelper.getRows(rootNode.getQuery(), function(err, rows) {
                    assert.ifError(err);
                    rows.forEach(function(row) {
                        assert.ok(typeof row.cartodb_id === 'number');
                        assert.ok(typeof row.the_geom === 'string');
                        assert.ok(typeof row.length === 'number');
                    });

                    return done();
                });
            });
        });

        it('should create analysis to all', function (done) {
            lineToLayerAllToAllDefinition.params.source_column = undefined;
            lineToLayerAllToAllDefinition.params.target_column = undefined;

            testHelper.createAnalyses(lineToLayerAllToAllDefinition, function(err, lineToLayerAllToAll) {
                assert.ifError(err);

                var rootNode = lineToLayerAllToAll.getRoot();

                testHelper.getRows(rootNode.getQuery(), function(err, rows) {
                    assert.ifError(err);
                    rows.forEach(function(row) {
                        assert.ok(typeof row.cartodb_id === 'number');
                        assert.ok(typeof row.the_geom === 'string');
                        assert.ok(typeof row.length === 'number');
                    });

                    return done();
                });
            });
        });
    });

    describe('closest line from source to target', function () {
        var lineToLayerAllToAllDefinition = {
            type: 'line-source-to-target',
            params: {
                source: sourceAtmMachines,
                source_column: 'kind',
                target: targetAtmMachines,
                target_column: 'kind',
                closest: true
            }
        };

        it('should create analysis joined by kind', function (done) {
            testHelper.createAnalyses(lineToLayerAllToAllDefinition, function(err, lineToLayerAllToAll) {
                assert.ifError(err);

                var rootNode = lineToLayerAllToAll.getRoot();

                testHelper.getRows(rootNode.getQuery(), function(err, rows) {
                    assert.ifError(err);
                    rows.forEach(function(row) {
                        assert.ok(typeof row.cartodb_id === 'number');
                        assert.ok(typeof row.the_geom === 'string');
                        assert.ok(typeof row.length === 'number');
                    });

                    return done();
                });
            });
        });

        it('should create analysis to all', function (done) {
            lineToLayerAllToAllDefinition.params.source_column = undefined;
            lineToLayerAllToAllDefinition.params.target_column = undefined;

            testHelper.createAnalyses(lineToLayerAllToAllDefinition, function(err, lineToLayerAllToAll) {
                assert.ifError(err);

                var rootNode = lineToLayerAllToAll.getRoot();

                testHelper.getRows(rootNode.getQuery(), function(err, rows) {
                    assert.ifError(err);
                    rows.forEach(function(row) {
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
