'use strict';

var assert = require('assert');

var Analysis = require('../../lib/analysis');

var BatchClient = require('../../lib/postgresql/batch-client');
var Node = require('../../lib/node/node');
var Factory = require('../../lib/workflow/factory');

var testConfig = require('../test-config');
var testHelper = require('../helper');

describe('workflow', function () {
    describe('create', function () {
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

        it('should work for basic source analysis', function (done) {
            Analysis.create(testConfig, sourceAnalysisDefinition, function (err, analysis) {
                assert.ok(!err, err);
                assert.equal(analysis.getQuery(), QUERY_ATM_MACHINES);

                done();
            });
        });

        it('should work for trade-area analysis', function (done) {
            var enqueueFn = BatchClient.prototype.enqueue;

            var enqueueCalled = false;
            BatchClient.prototype.enqueue = function (query, callback) {
                enqueueCalled = true;
                return callback(null, { status: 'ok' });
            };

            Analysis.create(testConfig, tradeAreaAnalysisDefinition, function (err, analysis) {
                BatchClient.prototype.enqueue = enqueueFn;

                assert.ifError(err);
                assert.ok(enqueueCalled);

                var rootNode = analysis.getRoot();
                assert.ok(analysis.getQuery().match(new RegExp('select\\s\\*\\sfrom ' + rootNode.getTargetTable())));

                var nodesList = analysis.getNodes();
                assert.equal(nodesList.length, 2);
                assert.deepEqual(nodesList.map(function (node) { return node.type; }), ['trade-area', 'source']);

                done();
            });
        });

        it('should ANALYZE cache table upon creation', function (done) {
            var enqueueFn = BatchClient.prototype.enqueue;

            var enqueueCalled = false;
            var lastEnqueuedQuery = null;
            BatchClient.prototype.enqueue = function (query, callback) {
                enqueueCalled = true;
                lastEnqueuedQuery = query[2].query;
                return callback(null, { status: 'ok' });
            };

            Analysis.create(testConfig, tradeAreaAnalysisDefinition, function (err, analysis) {
                BatchClient.prototype.enqueue = enqueueFn;

                assert.ifError(err);
                assert.ok(enqueueCalled);

                var nodeBuffer = analysis.getNodes()[0];
                assert.ok(lastEnqueuedQuery.match(new RegExp('ANALYZE ' + nodeBuffer.getTargetTable() + ';')));

                done();
            });
        });

        it('should invalidate cache for affected tables', function (done) {
            var enqueueFn = BatchClient.prototype.enqueue;

            var enqueueCalled = false;
            var invalidateQuery = null;
            BatchClient.prototype.enqueue = function (query, callback) {
                enqueueCalled = true;
                invalidateQuery = query[3].query;
                return callback(null, { status: 'ok' });
            };

            Analysis.create(testConfig, tradeAreaAnalysisDefinition, function (err) {
                BatchClient.prototype.enqueue = enqueueFn;

                assert.ifError(err);
                assert.ok(enqueueCalled);
                assert.ok(invalidateQuery.match(
                    new RegExp('select cdb_invalidate_varnish\\(\'public.atm_machines\'\\)', 'i')
                ));

                done();
            });
        });

        it('PRECHECK query should be inside a read-only transaction', function (done) {
            var TEST_SOURCE_TYPE = 'test-source';
            var TestSource = Node.create(TEST_SOURCE_TYPE, {
                table: Node.PARAM.STRING()
            }, { cache: true });
            TestSource.prototype.sql = function () {
                return 'select * from ' + this.table;
            };
            TestSource.prototype.preCheckQuery = function () {
                return 'INSERT INTO ' + this.table + ' VALUES (999, NULL, NULL, 100)';
            };

            var supportsTypeFn = Factory.prototype._supportsType;
            var getNodeClassFn = Factory.prototype.getNodeClass;

            Factory.prototype._supportsType = function () {
                return true;
            };

            Factory.prototype.getNodeClass = function () {
                return TestSource;
            };

            var definition = {
                type: TEST_SOURCE_TYPE,
                params: {
                    table: 'airbnb_rooms'
                }
            };
            var config = testConfig.create({ batch: { inlineExecution: true } });
            testHelper.createAnalyses(definition, config, function (err, analysis) {
                Factory.prototype._supportsType = supportsTypeFn;
                Factory.prototype.getNodeClass = getNodeClassFn;
                assert.ifError(err);
                assert.equal(
                    analysis.getRoot().getErrorMessage(),
                    'cannot execute INSERT in a read-only transaction'
                );
                done();
            });
        });

        it('should fail for invalid types', function (done) {
            var analysisType = 'wadus';
            Analysis.create(testConfig, { type: analysisType }, function (err) {
                assert.ok(err);
                assert.equal(err.message, 'Unknown analysis type: "' + analysisType + '"');
                done();
            });
        });

        it('should not fail to callback with error when analysis receives invalid param', function (done) {
            var invalidAnalysis = {
                type: 'trade-area',
                params: {
                    source: sourceAnalysisDefinition,
                    kind: TRADE_AREA_WALK,
                    time: 'text is invalid here',
                    dissolved: DISSOLVED
                }
            };
            Analysis.create(testConfig, invalidAnalysis, function (err) {
                assert.ok(err);
                assert.equal(
                    err.message,
                    'Invalid type for param "time", expects "number" type, got `"text is invalid here"`'
                );

                done();
            });
        });

        it('should have different cartodb_id using multiple isolines', function (done) {
            const definition = {
                type: 'buffer',
                params: {
                    source: {
                        type: 'source',
                        params: {
                            query: QUERY_ATM_MACHINES
                        }
                    },
                    isolines: ISOLINES,
                    dissolved: DISSOLVED,
                    radius: 100
                }
            };

            testHelper.getResult(definition, function (err, rows) {
                assert.ok(!err, err);
                assert.ok(rows.length > 0, true);

                testHelper.checkCartodbIdIsUnique(rows);

                done();
            });
        });

        describe('augment error info with node_id provided by client', function () {
            it('for unknown analysis error', function (done) {
                var invalidAnalysis = {
                    id: 'a0',
                    type: 'wadus'
                };

                Analysis.create(testConfig, invalidAnalysis, function (err) {
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
                Analysis.create(testConfig, invalidAnalysis, function (err) {
                    assert.ok(err);
                    assert.equal(err.node_id, 'a0');
                    done();
                });
            });
        });
    });
});

describe('operations', function () {
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
    beforeEach(function () {
        enqueueFn = BatchClient.prototype.enqueue;
        enqueueCalled = false;
        BatchClient.prototype.enqueue = function (query, callback) {
            enqueueCalled = true;
            return callback(null, { status: 'ok' });
        };
    });

    it('should return two nodes', function (done) {
        Analysis.create(testConfig, tradeAreaAnalysisDefinition, function (err, analysis) {
            BatchClient.prototype.enqueue = enqueueFn;
            assert.ifError(err);
            assert.ok(enqueueCalled);
            assert.equal(analysis.getNodes().length, 2);
            done();
        });
    });

    it('should return just one node', function (done) {
        Analysis.create(testConfig, sourceAnalysisDefinition, function (err, analysis) {
            BatchClient.prototype.enqueue = enqueueFn;
            assert.ifError(err);
            assert.ok(enqueueCalled);
            assert.equal(analysis.getNodes().length, 1);
            done();
        });
    });
});
