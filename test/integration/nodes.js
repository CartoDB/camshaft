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

    var BUFFER_OVER_SOURCE = {
        type: 'buffer',
        params: {
            source: SOURCE_ATM_MACHINES_DEF,
            radius: 10000
        }
    };

    describe('source', function() {

        var getColumnsFn;
        var getLastUpdatedTimeFromAffectedTablesFn;
        beforeEach(function() {
            getColumnsFn = QueryParser.prototype.getColumns;
            QueryParser.prototype.getColumns = function(query, callback) {
                return callback(null, []);
            };

            getLastUpdatedTimeFromAffectedTablesFn = DatabaseService.prototype.getLastUpdatedTimeFromAffectedTables;
        });
        afterEach(function() {
            QueryParser.prototype.getColumns = getColumnsFn;
            DatabaseService.prototype.getLastUpdatedTimeFromAffectedTables = getLastUpdatedTimeFromAffectedTablesFn;
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
            var sourcePostalCodesDef = {
                type: 'source',
                params: {
                    query: QUERY_POSTAL_CODES
                }
            };

            async.map([SOURCE_ATM_MACHINES_DEF, sourcePostalCodesDef], create, function(err, results) {
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

        it('should have different ids for same query but different CDB_QueryTables_Updated_At result', function(done) {
            var called = false;
            DatabaseService.prototype.getLastUpdatedTimeFromAffectedTables = function(query, callback) {
                var lastUpdatedTimeFromAffectedTables = new Date('2016-07-01');
                if (called) {
                    lastUpdatedTimeFromAffectedTables = new Date();
                }
                if (!called) {
                    called = true;
                }
                return callback(null, lastUpdatedTimeFromAffectedTables);
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
            DatabaseService.prototype.getLastUpdatedTimeFromAffectedTables = function(query, callback) {
                return callback(null, new Date('2016-07-01'));
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

    });
});
