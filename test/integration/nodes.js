'use strict';

var assert = require('assert');
var async = require('async');

var Analysis = require('../../lib/analysis');
var BatchClient = require('../../lib/postgresql/batch-client');


describe('nodes', function() {

    var USERNAME = 'localhost';

    function create(definition, callback) {
        Analysis.create(USERNAME, definition, callback);
    }

    var QUERY_ATM_MACHINES = 'select * from atm_machines';
    var QUERY_POSTAL_CODES = 'select * from postal_codes';

    var SOURCE_ATM_MACHINES_DEF = {
        type: 'source',
        params: {
            query: QUERY_ATM_MACHINES
        }
    };

    describe('source', function() {


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

    });

    describe('operation', function() {

        var TRADE_AREA_WALK = 'walk';
        var TRADE_AREA_15M = 900;

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
                    time: TRADE_AREA_15M
                }
            };

            var tradeArea15mOther = {
                type: 'trade-area',
                params: {
                    source: SOURCE_ATM_MACHINES_DEF,
                    kind: TRADE_AREA_WALK,
                    time: TRADE_AREA_15M
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
                    time: TRADE_AREA_15M
                }
            };
            var tradeArea30m = {
                type: 'trade-area',
                params: {
                    source: SOURCE_ATM_MACHINES_DEF,
                    kind: TRADE_AREA_WALK,
                    time: 1800
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
