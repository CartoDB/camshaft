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
        var ISOLINES = 4;
        var DISSOLVED = false;

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
                time: TRADE_AREA_15M,
                isolines: ISOLINES,
                dissolved: DISSOLVED
            }
        };

        it('should work for basic source analysis', function(done) {
            Analysis.create(testConfig, sourceAnalysisDefinition, function(err, analysis) {
                assert.ok(!err, err);
                assert.equal(analysis.getQuery(), QUERY_ATM_MACHINES);


                done();
            });
        });

        it('should work for trade-area analysis', function(done) {
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
                var rootNode = analysis.getRoot();
                assert.ok(analysis.getQuery().match(new RegExp('select\\s\\*\\sfrom ' + rootNode.getTargetTable())));

                var nodesList = analysis.getNodes();
                assert.equal(nodesList.length, 2);
                assert.deepEqual(nodesList.map(function(node) { return node.type; }), ['trade-area', 'source']);

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
                    time: 'text is invalid here',
                    dissolved: DISSOLVED
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

        it('should compute node requirements and limits for source', function(done) {
            Analysis.create(testConfig, sourceAnalysisDefinition, function(err, analysis) {
                assert.ok(!err, err);
                assert.equal(analysis.getRoot().requirements.getEstimatedRequirement('numberOfRows'), 6);
                assert.equal(analysis.getRoot().requirements.getLimit('maximumNumberOfRows'), undefined);
                done();
            });
        });

        it('should abort analysis over the limits for source', function(done) {
            var limitedConfig = testConfig.create({
                limits: {
                    analyses: {
                        source: {
                            maximumNumberOfRows: 5
                        }
                    }
                }
            });
            Analysis.create(limitedConfig, sourceAnalysisDefinition, function(err) {
                assert.ok(err);
                done();
            });
        });

        it('should compute node requirements and limits for trade areas', function(done) {
            var enqueueFn = BatchClient.prototype.enqueue;

            BatchClient.prototype.enqueue = function(query, callback) {
                return callback(null, {status: 'ok'});
            };

            Analysis.create(testConfig, tradeAreaAnalysisDefinition, function(err, analysis) {
                BatchClient.prototype.enqueue = enqueueFn;

                assert.ok(!err, err);
                assert.equal(analysis.getRoot().requirements.getEstimatedRequirement('numberOfRows'), 6);
                assert.equal(analysis.getRoot().requirements.getLimit('maximumNumberOfRows'), 1000000);
                done();
            });
        });

        it('should abort analysis over the limits for trade areas', function(done) {
            var limitedConfig = testConfig.create({
                limits: {
                    analyses: {
                        'trade-area': {
                            maximumNumberOfRows: 5
                        }
                    }
                }
            });

            var enqueueFn = BatchClient.prototype.enqueue;
            BatchClient.prototype.enqueue = function(query, callback) {
                return callback(null, {status: 'ok'});
            };

            Analysis.create(limitedConfig, tradeAreaAnalysisDefinition, function(err) {
                BatchClient.prototype.enqueue = enqueueFn;

                assert.ok(err);
                done();
            });
        });

    });

});
