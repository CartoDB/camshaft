'use strict';

var assert = require('assert');
var testHelper = require('../helper');

describe('aggregate-intersection analysis', function () {
    var SOURCE_AIRBNB = 'select * from airbnb_rooms';
    var SOURCE_DISTRICTS = 'select * from madrid_districts';
    var AGGREGATE_COLUMN = 'price';
    var UNIQUE_COLUMN = 'cartodb_id';
    var AVERAGE_FUNCTION = 'avg';
    var MAX_FUNCTION = 'max';
    var COUNT_FUNCTION = 'count';

    var sourceAirbnbRooms = {
        type: 'source',
        params: {
            query: SOURCE_DISTRICTS
        }
    };

    var sourceMadridDistrict = {
        type: 'source',
        params: {
            query: SOURCE_AIRBNB
        }
    };

    describe('average price analysis', function () {
        var averagePriceAnalysisDefinition = {
            type: 'aggregate-intersection',
            params: {
                source: sourceAirbnbRooms,
                target: sourceMadridDistrict,
                aggregate_function: AVERAGE_FUNCTION,
                aggregate_column: AGGREGATE_COLUMN
            }
        };

        it('should create an analysis and get districts with their average price', function (done) {
            testHelper.createAnalyses(averagePriceAnalysisDefinition, function (err, averagePriceAnalysis) {
                assert.ifError(err);

                var rootNode = averagePriceAnalysis.getRoot();

                testHelper.getRows(rootNode.getQuery(), function (err, rows) {
                    assert.ifError(err);
                    rows.forEach(function (row) {
                        assert.ok(typeof row.cartodb_id === 'number');
                        assert.ok(typeof row.the_geom === 'string');
                        assert.ok(typeof row.avg_price === 'number');
                    });

                    return done();
                });
            });
        });
    });

    describe('max price analysis', function () {
        var maxPriceAnalysisDefinition = {
            type: 'aggregate-intersection',
            params: {
                source: sourceAirbnbRooms,
                target: sourceMadridDistrict,
                aggregate_function: MAX_FUNCTION,
                aggregate_column: AGGREGATE_COLUMN
            }
        };

        it('should create an analysis and get districts with their max price room', function (done) {
            testHelper.createAnalyses(maxPriceAnalysisDefinition, function (err, maxPriceAnalysis) {
                assert.ifError(err);

                var rootNode = maxPriceAnalysis.getRoot();

                testHelper.getRows(rootNode.getQuery(), function (err, rows) {
                    assert.ifError(err);
                    rows.forEach(function (row) {
                        assert.ok(typeof row.cartodb_id === 'number');
                        assert.ok(typeof row.the_geom === 'string');
                        assert.ok(typeof row.max_price === 'number');
                    });

                    return done();
                });
            });
        });
    });

    describe('count rooms analysis', function () {
        var countRoomsAnalysisDefinition = {
            type: 'aggregate-intersection',
            params: {
                source: sourceAirbnbRooms,
                target: sourceMadridDistrict,
                aggregate_function: COUNT_FUNCTION,
                aggregate_column: UNIQUE_COLUMN
            }
        };

        it('should create an analysis and get reaggregations with their counted rooms', function (done) {
            testHelper.createAnalyses(countRoomsAnalysisDefinition, function (err, countRoomsAnalysis) {
                assert.ifError(err);

                var rootNode = countRoomsAnalysis.getRoot();

                testHelper.getRows(rootNode.getQuery(), function (err, rows) {
                    assert.ifError(err);
                    rows.forEach(function (row) {
                        assert.ok(typeof row.cartodb_id === 'number');
                        assert.ok(typeof row.the_geom === 'string');
                        assert.ok(typeof row.count_vals === 'number');
                    });

                    return done();
                });
            });
        });
    });

    describe('chained analysis', function () {
        var countRoomsAnalysisDefinition = {
            type: 'aggregate-intersection',
            params: {
                source: sourceAirbnbRooms,
                target: sourceMadridDistrict,
                aggregate_function: COUNT_FUNCTION,
                aggregate_column: UNIQUE_COLUMN
            }
        };
        var countRoomsAnalysisDefinition2 = {
            type: 'aggregate-intersection',
            params: {
                source: countRoomsAnalysisDefinition,
                target: sourceAirbnbRooms,
                aggregate_function: COUNT_FUNCTION,
                aggregate_column: UNIQUE_COLUMN
            }
        };

        it('should create not fail because of duplicate column names', function (done) {
            testHelper.createAnalyses(countRoomsAnalysisDefinition2, function (err, countRoomsAnalysis) {
                assert.ifError(err);

                var rootNode = countRoomsAnalysis.getRoot();

                testHelper.getRows(rootNode.getQuery(), function (err, rows) {
                    assert.ifError(err);
                    rows.forEach(function (row) {
                        assert.equal(typeof row.cartodb_id, 'number');
                        assert.equal(typeof row.the_geom, 'string');
                        assert.equal(typeof row.count_vals, 'number');
                    });

                    return done();
                });
            });
        });
    });
});
