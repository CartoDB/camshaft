'use strict';

var assert = require('assert');

var Analysis = require('../../lib/analysis');

var BatchClient = require('../../lib/postgresql/batch-client');

var testConfig = require('../test-config');

describe('workflow', function() {

    describe('create', function() {

        var QUERY_ATM_MACHINES = 'select * from atm_machines';
        var TRADE_AREA_WALK = 'walk';
        var TRADE_AREA_15M = 900;

        var sourceAnalysisDefinition = {
            type: 'source',
            params: {
                query: QUERY_ATM_MACHINES
            }
        };

        var tradeAreaAnalysisDefinition = {
            type: 'trade-area',
            params: {
                source: sourceAnalysisDefinition,
                kind: TRADE_AREA_WALK,
                time: TRADE_AREA_15M
            }
        };

        it('should work for basic source analysis', function(done) {
            Analysis.create(testConfig, sourceAnalysisDefinition, function(err, analysis) {
                assert.ok(!err, err);
                assert.equal(analysis.getQuery(), QUERY_ATM_MACHINES);


                done();
            });
        });

        it('should have same ids for same queries', function(done) {
            var enqueueFn = BatchClient.prototype.enqueue;

            var enqueueCalled = false;
            BatchClient.prototype.enqueue = function(query, callback) {
                enqueueCalled = true;
                return callback(null, {status: 'ok'});
            };

            Analysis.create(testConfig, tradeAreaAnalysisDefinition, function(err, analysis) {
                BatchClient.prototype.enqueue = enqueueFn;

                assert.ok(enqueueCalled);

                assert.ok(!err, err);
                assert.ok(analysis.getQuery().match(/select\s\*\sfrom analysis_trade_area/));

                done();
            });
        });

        it('should fail for invalid types', function(done) {
            var analysisType = 'wadus';
            Analysis.create(testConfig, {type: analysisType}, function(err) {
                assert.ok(err);
                assert.equal(err.message, 'Unknown analysis type: "' + analysisType + '"');
                done();
            });
        });

        it('should not fail to callback with error when analysis receives invalid param', function(done) {
            var invalidAnalysis = {
                type: 'trade-area',
                params: {
                    source: sourceAnalysisDefinition,
                    kind: TRADE_AREA_WALK,
                    time: 'text is invalid here'
                }
            };
            Analysis.create(testConfig, invalidAnalysis, function(err) {
                assert.ok(err);
                assert.equal(
                    err.message,
                    'Invalid type for param "time", expects "number" type, got `"text is invalid here"`'
                );

                done();
            });
        });

    });

});
