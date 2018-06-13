'use strict';

var assert = require('assert');
var testHelper = require('../helper');

describe('trade-area analysis', function() {
    var QUERY = 'select * from atm_machines limit 2';
    var KIND = 'car';
    var TIME = 600;
    var ISOLINES = 4;

    var sourceAtmMachines = {
        type: 'source',
        params: {
            query: QUERY
        }
    };

    describe('trade area analysis', function () {
        var tradeAreaDefinition = {
            type: 'trade-area',
            params: {
                source: sourceAtmMachines,
                kind: KIND,
                time: TIME,
                isolines: ISOLINES,
                dissolved: false
            }
        };

        it('should create an analysis', function (done) {
            testHelper.createAnalyses(tradeAreaDefinition, function(err, tradeArea) {
                assert.ifError(err);

                var rootNode = tradeArea.getRoot();

                testHelper.getRows(rootNode.getQuery(), function(err, rows) {
                    assert.ifError(err);
                    rows.forEach(function(row) {
                        assert.ok(typeof row.cartodb_id === 'number');
                        assert.ok(typeof row.the_geom === 'string');
                        assert.ok(typeof row.data_range === 'number');
                    });

                    return done();
                });
            });
        });

        it('should return unique cartodb_ids', function (done) {
            testHelper.getResult(tradeAreaDefinition, function(err, result) {
                assert.ifError(err);
                const uniqueIds = [...new Set(result.map(r => r.cartodb_id))];
                assert.equal(uniqueIds.length, result.length);

                return done();
            });
        });

        it('should not fail with Postgres reserved words', function (done) {
            const QUERY = 'select * from reserved_words limit 2';

            const sourceReservedWords = {
                type: 'source',
                params: {
                    query: QUERY
                }
            };

            const tradeAreaDefinition = {
                type: 'trade-area',
                params: {
                    source: sourceReservedWords,
                    kind: KIND,
                    time: TIME,
                    isolines: ISOLINES,
                    dissolved: false
                }
            };

            testHelper.getResult(tradeAreaDefinition, function (err) {
                assert.ifError(err);

                return done();
            });
        });

        it('should allow chained analyses', function (done) {
            var tradeAreaDefinition2 = {
                type: 'trade-area',
                params: {
                    source: tradeAreaDefinition,
                    kind: KIND,
                    time: TIME,
                    isolines: ISOLINES,
                    dissolved: false
                }
            };

            var tradeAreaDefinition3 = {
                type: 'trade-area',
                params: {
                    source: tradeAreaDefinition2,
                    kind: KIND,
                    time: TIME,
                    isolines: ISOLINES,
                    dissolved: false
                }
            };

            testHelper.getResult(tradeAreaDefinition3, function(err, result) {
                assert.ifError(err);
                const uniqueIds = [...new Set(result.map(r => r.cartodb_id))];
                assert.equal(uniqueIds.length, result.length);

                return done();
            });
        });

    });

    describe('trade area analysis dissolved', function () {
        var tradeAreaDefinition = {
            type: 'trade-area',
            params: {
                source: sourceAtmMachines,
                kind: KIND,
                time: TIME,
                isolines: ISOLINES,
                dissolved: true
            }
        };

        it('should create an analysis with boudaries dissolved', function (done) {
            testHelper.createAnalyses(tradeAreaDefinition, function(err, tradeArea) {
                assert.ifError(err);

                var rootNode = tradeArea.getRoot();

                testHelper.getRows(rootNode.getQuery(), function(err, rows) {
                    assert.ifError(err);
                    rows.forEach(function(row) {
                        assert.ok(typeof row.cartodb_id === 'number');
                        assert.ok(typeof row.the_geom === 'string');
                        assert.ok(typeof row.data_range === 'number');
                    });

                    return done();
                });
            });
        });

        it('should allow chained analyses', function (done) {
            var tradeAreaDefinition2 = {
                type: 'trade-area',
                params: {
                    source: tradeAreaDefinition,
                    kind: KIND,
                    time: TIME,
                    isolines: ISOLINES,
                    dissolved: true
                }
            };

            var tradeAreaDefinition3 = {
                type: 'trade-area',
                params: {
                    source: tradeAreaDefinition2,
                    kind: KIND,
                    time: TIME,
                    isolines: ISOLINES,
                    dissolved: true
                }
            };

            testHelper.getResult(tradeAreaDefinition3, function(err, result) {
                assert.ifError(err);
                const uniqueIds = [...new Set(result.map(r => r.cartodb_id))];
                assert.equal(uniqueIds.length, result.length);

                return done();
            });
        });

    });
});
