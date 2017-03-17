'use strict';

var assert = require('assert');
var async = require('async');

var Analysis = require('../../lib/analysis');
var BatchClient = require('../../lib/postgresql/batch-client');
var QueryParser = require('../../lib/postgresql/query-parser');
var DatabaseService = require('../../lib/service/database');

var testConfig = require('../test-config');

describe('nodes', function() {

    function create(definition, callback) {
        Analysis.create(testConfig, definition, callback);
    }

    var QUERY_ATM_MACHINES = 'select * from atm_machines';
    var QUERY_POSTAL_CODES = 'select * from postal_codes';

    var SOURCE_ATM_MACHINES_DEF = {
        type: 'source',
        params: {
            query: QUERY_ATM_MACHINES
        }
    };

    var SOURCE_POSTAL_CODES_DEF = {
        type: 'source',
        params: {
            query: QUERY_POSTAL_CODES
        }
    };

    var BUFFER_OVER_SOURCE = {
        type: 'buffer',
        params: {
            source: SOURCE_ATM_MACHINES_DEF,
            radius: 10000
        }
    };

    describe('source', function() {

        var getColumnsFn;
        beforeEach(function() {
            getColumnsFn = QueryParser.prototype.getColumns;
            QueryParser.prototype.getColumns = function(query, callback) {
                return callback(null, []);
            };
        });
        afterEach(function() {
            QueryParser.prototype.getColumns = getColumnsFn;
        });

        it('should have same ids for same queries', function(done) {
            async.map([SOURCE_ATM_MACHINES_DEF, SOURCE_ATM_MACHINES_DEF], create, function(err, results) {
                assert.ok(!err, err);

                assert.equal(results.length, 2);
                assert.equal(results[0].id(), results[1].id());
                assert.equal(results[0].getQuery(), results[1].getQuery());
                assert.equal(results[0].getQuery(), QUERY_ATM_MACHINES);

                done();
            });
        });


        it('should have different ids for different queries', function(done) {
            async.map([SOURCE_ATM_MACHINES_DEF, SOURCE_POSTAL_CODES_DEF], create, function(err, results) {
                assert.ok(!err, err);

                assert.equal(results.length, 2);
                assert.notEqual(results[0].id(), results[1].id());

                done();
            });
        });

        it('should have different ids for same query but columns changing', function(done) {
            var called = false;
            QueryParser.prototype.getColumns = function(query, callback) {
                var columns = [{name: 'a'}, {name: 'b'}, {name: 'c'}];
                if (called) {
                    columns = [{name: 'x'}, {name: 'y'}, {name: 'z'}];
                }
                if (!called) {
                    called = true;
                }
                return callback(null, columns);
            };

            async.map([SOURCE_ATM_MACHINES_DEF, SOURCE_ATM_MACHINES_DEF], create, function(err, results) {
                assert.ok(!err, err);

                assert.equal(results.length, 2);
                assert.notEqual(results[0].id(), results[1].id());

                done();
            });
        });

    });

    describe('source last updated at affecting node.id', function() {

        var enqueueCalled = 0;
        var enqueueFn;
        var getLastUpdatedTimeFromAffectedTablesFn;
        beforeEach(function() {
            enqueueFn = BatchClient.prototype.enqueue;
            BatchClient.prototype.enqueue = function(query, callback) {
                enqueueCalled += 1;
                return callback(null, {status: 'ok'});
            };
            getLastUpdatedTimeFromAffectedTablesFn = DatabaseService.prototype.getLastUpdatedTimeFromAffectedTables;
        });
        afterEach(function() {
            assert.ok(enqueueCalled > 0);
            BatchClient.prototype.enqueue = enqueueFn;
            DatabaseService.prototype.getLastUpdatedTimeFromAffectedTables = getLastUpdatedTimeFromAffectedTablesFn;
        });

        it('should have different ids for same query but different CDB_QueryTables_Updated_At result', function(done) {
            var called = false;
            DatabaseService.prototype.getLastUpdatedTimeFromAffectedTables = function(node, skip, callback) {
                if (node.type !== 'source' || node.getUpdatedAt() !== null) {
                    return callback(null, {'last_update': node.getUpdatedAt(), 'affected_tables': []});
                }
                var lastUpdatedTimeFromAffectedTables = new Date('2016-07-01');
                if (called) {
                    lastUpdatedTimeFromAffectedTables = new Date();
                }
                if (!called) {
                    called = true;
                }
                return callback(null, {'last_update': lastUpdatedTimeFromAffectedTables, 'affected_tables': []});
            };

            async.map([BUFFER_OVER_SOURCE, BUFFER_OVER_SOURCE], create, function(err, results) {
                assert.ok(!err, err);

                assert.equal(results.length, 2);

                var bufferA = results[0].rootNode;
                var bufferB = results[1].rootNode;

                assert.notEqual(bufferA.source.id(), bufferB.source.id(),
                        'Sources for buffer should have different id(): "' +
                        bufferA.source.id() + '" != "' + bufferB.source.id() + '"'
                );

                assert.notEqual(bufferA.id(), bufferB.id(),
                        'Buffers, as dependant nodes, should also have a different id(): "' +
                        bufferA.id() + '" != "' + bufferB.id() + '"'
                );

                done();
            });
        });

        it('should have same ids for same query and same CDB_QueryTables_Updated_At result', function(done) {
            DatabaseService.prototype.getLastUpdatedTimeFromAffectedTables = function(node, skip, callback) {
                return callback(null, {'last_update': new Date('2016-07-01'), 'affected_tables': []});
            };

            async.map([BUFFER_OVER_SOURCE, BUFFER_OVER_SOURCE], create, function(err, results) {
                assert.ok(!err, err);

                assert.equal(results.length, 2);

                var bufferA = results[0].rootNode;
                var bufferB = results[1].rootNode;

                assert.equal(bufferA.source.id(), bufferB.source.id(),
                        'Sources for buffer should have same id(): "' +
                        bufferA.source.id() + '" == "' + bufferB.source.id() + '"'
                );

                assert.equal(bufferA.id(), bufferB.id(),
                        'Buffers, as dependant nodes, should also have same id(): "' +
                        bufferA.id() + '" == "' + bufferB.id() + '"'
                );

                done();
            });
        });

        it('should store the affected tables for the source node', function(done) {
            DatabaseService.prototype.getLastUpdatedTimeFromAffectedTables = function(node, skip, callback) {
                return callback(null, {'last_update': new Date('2016-07-01'),
                                       'affected_tables': [
                                           {'schema': 'public', 'table':'atm_machines'}
                                        ]});
            };
            async.map([SOURCE_ATM_MACHINES_DEF], create, function(err, results) {
                assert.ok(!err, err);
                assert.equal(results.length, 1);
                var sourceNode = results[0].rootNode;
                assert.equal(sourceNode.getAffectedTables()[0], 'public.atm_machines');
                done();
            });
        });

        it('should store the affected tables for the non-source node', function(done) {
            DatabaseService.prototype.getLastUpdatedTimeFromAffectedTables = function(node, skip, callback) {
                return callback(null, {'last_update': new Date('2016-07-01'),
                                       'affected_tables': []});
            };
            async.map([BUFFER_OVER_SOURCE], create, function(err, results) {
                assert.ok(!err, err);
                assert.equal(results.length, 1);
                var sourceNode = results[0].rootNode;
                assert.equal(sourceNode.getAffectedTables().length, 0);
                done();
            });
        });

    });

    describe('operation', function() {

        var TRADE_AREA_WALK = 'walk';
        var TRADE_AREA_15M = 900;
        var ISOLINES = 4;
        var DISSOLVED = false;

        var enqueueFn;
        var enqueueCalled;
        before(function() {
            enqueueFn = BatchClient.prototype.enqueue;
            enqueueCalled = 0;
            BatchClient.prototype.enqueue = function(query, callback) {
                enqueueCalled += 1;
                return callback(null, {status: 'ok'});
            };
        });
        after(function() {
            assert.ok(enqueueCalled > 0);
            BatchClient.prototype.enqueue = enqueueFn;
        });

        it('should have same ids for same params', function(done) {
            var tradeArea15m = {
                type: 'trade-area',
                params: {
                    source: SOURCE_ATM_MACHINES_DEF,
                    kind: TRADE_AREA_WALK,
                    time: TRADE_AREA_15M,
                    isolines: ISOLINES,
                    dissolved: DISSOLVED
                }
            };

            var tradeArea15mOther = {
                type: 'trade-area',
                params: {
                    source: SOURCE_ATM_MACHINES_DEF,
                    kind: TRADE_AREA_WALK,
                    time: TRADE_AREA_15M,
                    isolines: ISOLINES,
                    dissolved: false
                }
            };

            async.map([tradeArea15m, tradeArea15mOther], create, function(err, results) {
                assert.ok(!err, err);

                assert.equal(results.length, 2);
                assert.equal(results[0].id(), results[1].id());
                assert.equal(results[0].getQuery(), results[1].getQuery());

                done();
            });
        });

        it('should have different ids for different params', function(done) {
            var tradeArea15m = {
                type: 'trade-area',
                params: {
                    source: SOURCE_ATM_MACHINES_DEF,
                    kind: TRADE_AREA_WALK,
                    time: TRADE_AREA_15M,
                    isolines: ISOLINES,
                    dissolved: DISSOLVED
                }
            };
            var tradeArea30m = {
                type: 'trade-area',
                params: {
                    source: SOURCE_ATM_MACHINES_DEF,
                    kind: TRADE_AREA_WALK,
                    time: 1800,
                    isolines: ISOLINES,
                    dissolved: true
                }
            };

            async.map([tradeArea15m, tradeArea30m], create, function(err, results) {
                assert.ok(!err, err);

                assert.equal(results.length, 2);
                assert.notEqual(results[0].id(), results[1].id());
                assert.notEqual(results[0].getQuery(), results[1].getQuery());

                done();
            });
        });

        it('should have different ids for same params but different owner', function(done) {
            var tradeArea15m = {
                type: 'trade-area',
                params: {
                    source: SOURCE_ATM_MACHINES_DEF,
                    kind: TRADE_AREA_WALK,
                    time: TRADE_AREA_15M,
                    isolines: ISOLINES,
                    dissolved: DISSOLVED
                }
            };

            async.parallel(
                [
                    function(callback) {
                        var clonedTestConfig = JSON.parse(JSON.stringify(testConfig));
                        clonedTestConfig.user = 'user1';
                        Analysis.create(clonedTestConfig, tradeArea15m, callback);
                    },
                    function(callback) {
                        var clonedTestConfig = JSON.parse(JSON.stringify(testConfig));
                        clonedTestConfig.user = 'user2';
                        Analysis.create(clonedTestConfig, tradeArea15m, callback);
                    }
                ],
                function(err, results) {
                    assert.ok(!err, err);

                    assert.equal(results.length, 2);
                    assert.notEqual(results[0].id(), results[1].id());
                    assert.notEqual(results[0].getQuery(), results[1].getQuery());

                    done();
                }
            );

        });

        it('should calculate and return one input node for a node', function(done) {
            var tradeArea15m = {
                type: 'trade-area',
                params: {
                    source: SOURCE_ATM_MACHINES_DEF,
                    kind: TRADE_AREA_WALK,
                    time: TRADE_AREA_15M,
                    isolines: ISOLINES,
                    dissolved: DISSOLVED
                }
            };

            Analysis.create(testConfig, tradeArea15m, function(err, analysis) {
                assert.ok(!err, err);
                var rootNode = analysis.getRoot();
                var inputNodes = rootNode.getAllInputNodes();
                assert.equal(inputNodes.length, 1);
                done();
            });
        });

        it('should calculate and return two input nodes, not just the direct ones', function(done) {
            var tradeArea15m = {
                type: 'trade-area',
                params: {
                    source: BUFFER_OVER_SOURCE,
                    kind: TRADE_AREA_WALK,
                    time: TRADE_AREA_15M,
                    isolines: ISOLINES,
                    dissolved: DISSOLVED
                }
            };

            Analysis.create(testConfig, tradeArea15m, function(err, analysis) {
                assert.ok(!err, err);
                var rootNode = analysis.getRoot();
                var inputNodes = rootNode.getAllInputNodes();
                assert.equal(inputNodes.length, 2);
                done();
            });
        });

        it('should calculate and return three input nodes, not just the direct ones', function(done) {
            var merge = {
                type: 'merge',
                params: {
                    left_source: SOURCE_ATM_MACHINES_DEF,
                    right_source: SOURCE_ATM_MACHINES_DEF,
                    left_source_column: 'cartodb_id',
                    right_source_column: 'cartodb_id'
                }
            };

            var tradeArea15m = {
                type: 'trade-area',
                params: {
                    source: merge,
                    kind: TRADE_AREA_WALK,
                    time: TRADE_AREA_15M,
                    isolines: ISOLINES,
                    dissolved: DISSOLVED
                }
            };

            Analysis.create(testConfig, tradeArea15m, function(err, analysis) {
                assert.ok(!err, err);
                var rootNode = analysis.getRoot();
                var inputNodes = rootNode.getAllInputNodes();
                var types = inputNodes.reduce(function(list, node){
                    list[node.getType()] = ++list[node.getType()] || 1;
                    return list;
                }, {});
                assert.equal(types.merge, 1);
                assert.equal(types.source, 1);
                assert.equal(inputNodes.length, 2);
                done();
            });
        });

        it('should return a set of input nodes, removing duplicates', function(done) {
            var merge = {
                type: 'merge',
                params: {
                    left_source: SOURCE_ATM_MACHINES_DEF,
                    right_source: SOURCE_ATM_MACHINES_DEF,
                    left_source_column: 'cartodb_id',
                    right_source_column: 'cartodb_id'
                }
            };


            var tradeArea15m = {
                type: 'trade-area',
                params: {
                    source: merge,
                    kind: TRADE_AREA_WALK,
                    time: TRADE_AREA_15M,
                    isolines: ISOLINES,
                    dissolved: DISSOLVED
                }
            };

            var mergeSourceAndTradeArea = {
                type: 'merge',
                params: {
                    left_source: SOURCE_ATM_MACHINES_DEF,
                    right_source: tradeArea15m,
                    left_source_column: 'cartodb_id',
                    right_source_column: 'cartodb_id'
                }
            };

            Analysis.create(testConfig, mergeSourceAndTradeArea, function(err, analysis) {
                assert.ok(!err, err);
                var rootNode = analysis.getRoot();
                var inputNodes = rootNode.getAllInputNodes();
                var types = inputNodes.reduce(function(list, node){
                    list[node.getType()] = ++list[node.getType()] || 1;
                    return list;
                }, {});
                assert.equal(inputNodes.length, 3);
                assert.equal(types.source, 1);
                assert.equal(types.merge, 1);
                assert.equal(types['trade-area'], 1);
                done();
            });
        });

        it('should filter and return only source nodes for all the input nodes', function(done) {
            var merge = {
                type: 'merge',
                params: {
                    left_source: SOURCE_ATM_MACHINES_DEF,
                    right_source: SOURCE_ATM_MACHINES_DEF,
                    left_source_column: 'cartodb_id',
                    right_source_column: 'cartodb_id'
                }
            };

            var tradeArea15m = {
                type: 'trade-area',
                params: {
                    source: merge,
                    kind: TRADE_AREA_WALK,
                    time: TRADE_AREA_15M,
                    isolines: ISOLINES,
                    dissolved: DISSOLVED
                }
            };

            Analysis.create(testConfig, tradeArea15m, function(err, analysis) {
                assert.ok(!err, err);
                var rootNode = analysis.getRoot();
                var inputNodes = rootNode.getAllInputNodes(function(node) {
                    return node.getType() === 'source';
                });
                var types = inputNodes.reduce(function(list, node){
                    list[node.getType()] = ++list[node.getType()] || 1;
                    return list;
                }, {});
                assert.equal('merge' in types, false);
                assert.equal(types.source, 1);
                assert.equal(inputNodes.length, 1);
                done();
            });
        });
    });
});
