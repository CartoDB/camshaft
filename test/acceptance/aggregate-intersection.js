'use strict';

var assert = require('assert');

var Analysis = require('../../lib/analysis');

var testConfig = require('../test-config');
var BatchClient = require('../../lib/postgresql/batch-client');
var QueryRunner = require('../../lib/postgresql/query-runner');

describe('aggregate-intersection analysis', function() {

    var queryRunner;
    var enqueueFn;
    var enqueueCalled;

    before(function() {
        queryRunner = new QueryRunner(testConfig.db);
        enqueueFn = BatchClient.prototype.enqueue;
        enqueueCalled = 0;
        BatchClient.prototype.enqueue = function(query, callback) {
            enqueueCalled += 1;
            return callback(null, { status: 'ok' });
        };
    });

    after(function () {
        assert.ok(enqueueCalled > 0);
        BatchClient.prototype.enqueue = enqueueFn;
    });

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
            query: SOURCE_AIRBNB
        }
    };

    var sourceMadridDistrict = {
        type: 'source',
        params: {
            query: SOURCE_DISTRICTS
        }
    };

    function performAnalysis(definition, callback) {
        Analysis.create(testConfig, definition, function (err, analysis) {
            if (err) {
                return callback(err);
            }

            queryRunner.run(analysis.getQuery(), function(err, result) {
                if (err) {
                    return callback(err);
                }

                assert.ok(Array.isArray(result.rows));
                var aggregatedValues = result.rows.map(function (district) {
                    assert.ok(Number.isFinite(district.cartodb_id));
                    assert.ok(district.name);
                    assert.ok(district.the_geom);
                    assert.ok(district.the_geom_webmercator);

                    var aggregateProperty = [
                        definition.params.aggregate_function,
                        definition.params.aggregate_column
                    ].join('_');

                    assert.ok(district[aggregateProperty]);

                    return district[aggregateProperty];
                });

                callback(null, aggregatedValues);
            });
        });
    }


    describe('average price analysis', function  () {
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
            performAnalysis(averagePriceAnalysisDefinition, function (err, averageValues) {
                assert.ok(!err, err);
                assert.deepEqual(averageValues, [ 72.42857142857143, 39.92857142857143 ]);

                done();
            });
        });

    });

    describe('max price analysis', function  () {

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
            performAnalysis(maxPriceAnalysisDefinition,  function (err, maxValues) {
                assert.ok(!err, err);
                assert.deepEqual(maxValues, [ 195, 100 ]);

                done();
            });
        });
    });

    describe('count rooms analysis', function  () {

        var countRoomsAnalysisDefinition = {
            type: 'aggregate-intersection',
            params: {
                source: sourceAirbnbRooms,
                target: sourceMadridDistrict,
                aggregate_function: COUNT_FUNCTION,
                aggregate_column: UNIQUE_COLUMN
            }
        };

        it('should create an analysis and get districts with their counted rooms', function (done) {
            performAnalysis(countRoomsAnalysisDefinition,  function (err, countValues) {
                assert.ok(!err, err);
                assert.deepEqual(countValues, [ 14, 14 ]);

                done();
            });
        });
    });
});
