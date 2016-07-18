'use strict';

var assert = require('assert');

var Analysis = require('../../lib/analysis');

var testConfig = require('../test-config');
var QueryRunner = require('../../lib/postgresql/query-runner');

describe('intersection analysis', function() {

    var queryRunner;

    before(function() {
        queryRunner = new QueryRunner(testConfig.db);
    });

    var SOURCE_AIRBNB = 'select * from airbnb_rooms';
    var SOURCE_DISTRICTS = 'select * from madrid_districts';

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

    var config = testConfig.create({
        batch: {
            inlineExecution: true
        }
    });

    function performAnalysis(definition, callback) {
        Analysis.create(config, definition, function (err, analysis) {
            if (err) {
                return callback(err);
            }

            queryRunner.run(analysis.getQuery(), function(err, result) {
                if (err) {
                    return callback(err);
                }

                callback(null, result.rows);
            });
        });
    }

    describe('intersection with all source columns', function  () {
        var averagePriceAnalysisDefinition = {
            type: 'intersection',
            params: {
                source: sourceAirbnbRooms,
                target: sourceMadridDistrict
            }
        };

        it('should create an analysis', function (done) {
            performAnalysis(averagePriceAnalysisDefinition, function (err, result) {
                assert.ok(!err, err);
                assert.ok(result);

                assert.ok(result[0].source_cartodb_id);
                assert.ok(result[0].source_name);

                done();
            });
        });

    });

    describe('intersection with only name source column', function  () {
        var averagePriceAnalysisDefinition = {
            type: 'intersection',
            params: {
                source: sourceAirbnbRooms,
                source_columns: ['name'],
                target: sourceMadridDistrict
            }
        };

        it('should create an analysis', function (done) {
            performAnalysis(averagePriceAnalysisDefinition, function (err, result) {
                assert.ok(!err, err);
                assert.ok(result);

                assert.ok(!result[0].source_cartodb_id);
                assert.ok(result[0].source_name);

                done();
            });
        });

    });

});
