'use strict';

var assert = require('assert');

var Analysis = require('../../lib/analysis');

var testConfig = require('../test-config');
var QueryRunner = require('../../lib/postgresql/query-runner');

describe('data-observatory-measure analysis', function() {

    var queryRunner;

    before(function() {
        queryRunner = new QueryRunner(testConfig.db);
    });

    after(function () {
        // assert.ok(enqueueCalled > 0);
        // BatchClient.prototype.enqueue = enqueueFn;
    });

    var QUERY = 'select * from atm_machines limit 2';
    var FINAL_COLUMN = 'adults_first_level_studies';
    var SEGMENT_NAME = 'es.ine.t15_8';

    var sourceBarrios = {
        type: 'source',
        params: {
            query: QUERY
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

                assert.ok(Array.isArray(result.rows));
                var values = result.rows.map(function (value) {
                    return value;
                });

                callback(null, values);
            });
        });
    }

    describe('data observatory measure analysis', function () {
        var doMeasureDefinition = {
            type: 'data-observatory-measure',
            params: {
                source: sourceBarrios,
                final_column: FINAL_COLUMN,
                segment_name: SEGMENT_NAME,
                percent: false
            }
        };

        it('should create an analysis', function (done) {
            performAnalysis(doMeasureDefinition, function (err, values) {
                if(err) {
                    return done(err);
                }
                assert.ok(values);
                done();
            });
        });
    });

    describe('data observatory measure denominator analysis', function () {
        var doMeasureDefinition = {
            type: 'data-observatory-measure',
            params: {
                source: sourceBarrios,
                final_column: FINAL_COLUMN,
                segment_name: SEGMENT_NAME,
                percent: false
            }
        };

        it('should create an analysis with denominator', function (done) {
            performAnalysis(doMeasureDefinition, function (err, values) {
                if(err) {
                    return done(err);
                }
                assert.ok(values);
                done();
            });
        });
    });
});
