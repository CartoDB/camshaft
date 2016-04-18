'use strict';

var assert = require('assert');
var async = require('async');

var Analysis = require('../../lib/analysis');

var testConfig = require('../test-config');
var BatchClient = require('../../lib/postgresql/batch-client');
var QueryRunner = require('../../lib/postgresql/query-runner');


describe('filters', function() {

    var queryRunner;
    var enqueueFn;
    var enqueueCalled;

    before(function() {
        queryRunner = new QueryRunner(testConfig.db);
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

    function getRows(query, callback) {
        queryRunner.run(query, function(err, result) {
            assert.ok(!err, err);
            assert.ok(result);
            var rows = result.rows;
            assert.ok(Array.isArray(rows));

            return callback(null, rows);
        });
    }

    var QUERY_ATM_MACHINES = 'select * from atm_machines';
    var BANKS_ALL = ['BBVA', 'Santander', 'Santander', 'Santander', 'BBVA', 'ING'];
    var BANKS_BBVA = BANKS_ALL.filter(function(bank) {return bank === 'BBVA'; });

    function filteredNodeDefinition(node, filters) {
        var clonedNode = JSON.parse(JSON.stringify(node));
        clonedNode.params.filters = filters;
        return clonedNode;
    }

    var sourceAnalysisDefinition = {
        type: 'source',
        params: {
            query: QUERY_ATM_MACHINES
        }
    };

    it('should return all banks', function(done) {
        Analysis.create(testConfig, sourceAnalysisDefinition, function(err, analysis) {
            assert.ok(!err, err);

            getRows(analysis.getQuery(), function(err, rows) {
                assert.ok(!err, err);

                var banks = rows.map(function(row) {
                    return row.bank;
                });

                assert.deepEqual(banks, BANKS_ALL);

                done();
            });

        });
    });

    it('should return just BBVA banks as they are filtered', function(done) {
        var filteredSource = filteredNodeDefinition(sourceAnalysisDefinition, {
            bank_category: {
                type: 'category',
                column: 'bank',
                params: {
                    accept: ['BBVA']
                }
            }
        });
        Analysis.create(testConfig, filteredSource, function(err, analysis) {
            assert.ok(!err, err);

            getRows(analysis.getQuery(), function(err, rows) {
                assert.ok(!err, err);

                var banks = rows.map(function(row) {
                    return row.bank;
                });

                assert.deepEqual(banks, BANKS_BBVA);

                done();
            });
        });
    });

    it('should return all banks as we are skipping the category filter', function(done) {
        var filteredSource = filteredNodeDefinition(sourceAnalysisDefinition, {
            bank_category: {
                type: 'category',
                column: 'bank',
                params: {
                    accept: ['BBVA']
                }
            }
        });
        Analysis.create(testConfig, filteredSource, function(err, analysis) {
            assert.ok(!err, err);

            getRows(analysis.getRoot().getQuery({bank_category: false}), function(err, rows) {
                assert.ok(!err, err);

                var banks = rows.map(function(row) {
                    return row.bank;
                });

                assert.deepEqual(banks, BANKS_ALL);

                done();
            });
        });
    });

    it('should filter dependant analyses based on filters', function(done) {
        var filteredSource = filteredNodeDefinition(sourceAnalysisDefinition, {
            bank_category: {
                type: 'category',
                column: 'bank',
                params: {
                    accept: ['BBVA']
                }
            }
        });

        var tradeAreaAnalysisDefinition = {
            type: 'buffer',
            params: {
                source: filteredSource,
                radius: 5000
            }
        };

        Analysis.create(testConfig, tradeAreaAnalysisDefinition, function(err, analysis) {
            assert.ok(!err, err);

            getRows(analysis.getRoot().getQuery(), function(err, rows) {
                assert.ok(!err, err);

                var banks = rows.map(function(row) {
                    return row.bank;
                });

                assert.deepEqual(banks, BANKS_BBVA);

                done();
            });
        });
    });

    describe('node-id', function() {
        function create(definition, callback) {
            Analysis.create(testConfig, definition, callback);
        }

        it('should have different id when filter is applied', function(done) {
            var filteredSource = filteredNodeDefinition(sourceAnalysisDefinition, {
                bank_category: {
                    type: 'category',
                    column: 'bank',
                    params: {
                        accept: ['BBVA']
                    }
                }
            });

            async.map([sourceAnalysisDefinition, filteredSource], create, function(err, results) {
                assert.ok(!err, err);

                assert.equal(results.length, 2);
                assert.notEqual(results[0].id(), results[1].id());
                assert.notEqual(results[0].getQuery(), results[1].getQuery());

                done();
            });
        });

    });

});
