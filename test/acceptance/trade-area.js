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
                result.sort(function(a,b) {
                    assert.ok(a.cartodb_id !== b.cartodb_id);
                    return a.cartodb_id < b.cartodb_id;
                });
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
    });
});
