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

        var doAnalysisDefinition = {
            type: 'data-observatory-multiple-measures',
            params: {
                source: sourceAnalysisDefinition,
                numerators: ['test.numerator'],
                normalizations: ['prenormalized'],
                denominators: ['test.denominator'],
                geom_ids: ['test.geoids'],
                numerator_timespans: ['test.timespan'],
                column_names: ['test_column']
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

                assert.ok(!err, err);
                assert.ok(enqueueCalled);

                var rootNode = analysis.getRoot();
                assert.ok(analysis.getQuery().match(new RegExp('select\\s\\*\\sfrom ' + rootNode.getTargetTable())));

                var nodesList = analysis.getNodes();
                assert.equal(nodesList.length, 2);
                assert.deepEqual(nodesList.map(function(node) { return node.type; }), ['trade-area', 'source']);

                done();
            });
        });

        it('should ANALYZE cache table upon creation', function(done) {
            var enqueueFn = BatchClient.prototype.enqueue;

            var enqueueCalled = false;
            var lastEnqueuedQuery = null;
            BatchClient.prototype.enqueue = function(query, callback) {
                enqueueCalled = true;
                lastEnqueuedQuery = query[2].query;
                return callback(null, {status: 'ok'});
            };

            Analysis.create(testConfig, tradeAreaAnalysisDefinition, function(err, analysis) {
                BatchClient.prototype.enqueue = enqueueFn;

                assert.ok(!err, err);
                assert.ok(enqueueCalled);

                var nodeBuffer = analysis.getNodes()[0];
                assert.ok(lastEnqueuedQuery.match(new RegExp('ANALYZE ' + nodeBuffer.getTargetTable() + ';')));

                done();
            });
        });

        it('should invalidate cache for affected tables', function(done) {
            var enqueueFn = BatchClient.prototype.enqueue;

            var enqueueCalled = false;
            var invalidateQuery = null;
            BatchClient.prototype.enqueue = function(query, callback) {
                enqueueCalled = true;
                invalidateQuery = query[3].query;
                return callback(null, {status: 'ok'});
            };

            Analysis.create(testConfig, tradeAreaAnalysisDefinition, function(err) {
                BatchClient.prototype.enqueue = enqueueFn;

                assert.ok(!err, err);
                assert.ok(enqueueCalled);
                assert.ok(invalidateQuery.match(
                    new RegExp('select cdb_invalidate_varnish\\(\'public.atm_machines\'\\)', 'i')
                ));

                done();
            });
        });

        it('should execute PRECHECK query if defined in the analysis node', function(done) {
            var enqueueFn = BatchClient.prototype.enqueue;

            var enqueueCalled = false;
            var lastEnqueuedQuery = null;
            BatchClient.prototype.enqueue = function(query, callback) {
                enqueueCalled = true;
                lastEnqueuedQuery = query[2].query;
                return callback(null, {status: 'ok'});
            };

            Analysis.create(testConfig, doAnalysisDefinition, function(err) {
                assert.ok(!err, err);
                BatchClient.prototype.enqueue = enqueueFn;
                assert.ok(enqueueCalled);
                var expectedPreCheckQuery = [
                    'BEGIN;SET TRANSACTION READ ONLY;',
                    'SELECT cdb_dataservices_client._OBS_PreCheck(\'select * from atm_machines\',',
                    ' \'{"numer_id": "test.numerator","denom_id": "test.denominator",',
                    '"normalization": "prenormalized","geom_id": "test.geoids",',
                    '"numer_timespan": "test.timespan"}\'::jsonb);COMMIT;'
                ].join('');
                assert.equal(lastEnqueuedQuery,expectedPreCheckQuery);

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

        describe('augment error info with node_id provided by client', function () {
            it('for unknown analysis error', function (done) {
                var invalidAnalysis = {
                    id: 'a0',
                    type: 'wadus'
                };

                Analysis.create(testConfig, invalidAnalysis, function(err) {
                    assert.ok(err);
                    assert.equal(err.node_id, 'a0');
                    done();
                });
            });

            it('for invalid param error', function (done) {
                var invalidAnalysis = {
                    id: 'a0',
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
                    assert.equal(err.node_id, 'a0');
                    done();
                });
            });
        });
    });
});

describe('operations', function() {

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

    var enqueueCalled = 0;
    var enqueueFn;
    beforeEach(function() {
        enqueueFn = BatchClient.prototype.enqueue;
        enqueueCalled = false;
        BatchClient.prototype.enqueue = function(query, callback) {
            enqueueCalled = true;
            return callback(null, {status: 'ok'});
        };
    });

    it('should return two nodes', function(done) {
        Analysis.create(testConfig, tradeAreaAnalysisDefinition, function(err, analysis) {
            assert.ok(!err, err);
            assert.equal(analysis.getNodes().length, 2);
            done();
        });
    });

    it('should return just one node', function(done) {
        Analysis.create(testConfig, sourceAnalysisDefinition, function(err, analysis) {
            assert.ok(!err, err);
            assert.equal(analysis.getNodes().length, 1);
            done();
        });
    });
});
