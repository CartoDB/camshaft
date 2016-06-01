'use strict';

var assert = require('assert');

var BatchClient = require('../../lib/postgresql/batch-client');
var QueryRunner = require('../../lib/postgresql/query-runner');
var Analysis = require('../../lib/analysis');

var testConfig = require('../test-config');

describe('node-filter', function() {

    function getRows(query, callback) {
        var queryRunner = new QueryRunner(testConfig.db);
        queryRunner.run(query, function(err, result) {
            assert.ok(!err, err);
            assert.ok(result);
            var rows = result.rows;
            assert.ok(Array.isArray(rows));

            return callback(null, rows);
        });
    }

    var enqueueFn;
    var enqueueCalled;

    before(function() {
        enqueueFn = BatchClient.prototype.enqueue;
        enqueueCalled = 0;
        BatchClient.prototype.enqueue = function(query, callback) {
            enqueueCalled += 1;
            return callback(null, { status: 'ok' });
        };
    });

    after(function () {
        assert.ok(enqueueCalled > 0);
        BatchClient.prototype.enqueue = enqueueFn;
    });

    describe('range', function() {
        var rangeFilter = {
            id: 'a1',
            type: 'filter-range',
            params: {
                source: {
                    type: 'source',
                    params: {
                        query: 'SELECT * FROM airbnb_rooms'
                    }
                },
                column: 'price',
                min: 100
            }
        };

        it('should return only rows with min price = 100', function (done) {
            Analysis.create(testConfig, rangeFilter, function (err, analysis) {
                if (err) {
                    return done(err);
                }

                getRows(analysis.getQuery(), function(err, rows) {
                    assert.ok(!err, err);

                    rows.forEach(function(row) {
                        assert.ok(row.price >= 100, JSON.stringify(row));
                    });

                    done();
                });
            });
        });
    });

    describe('category', function() {
        var rangeFilter = {
            id: 'a1',
            type: 'filter-category',
            params: {
                source: {
                    type: 'source',
                    params: {
                        query: 'SELECT * FROM atm_machines'
                    }
                },
                column: 'bank',
                accept: ['Santander']
            }
        };

        it('should return only rows with min bank = Santander', function (done) {
            Analysis.create(testConfig, rangeFilter, function (err, analysis) {
                if (err) {
                    return done(err);
                }

                getRows(analysis.getQuery(), function(err, rows) {
                    assert.ok(!err, err);

                    rows.forEach(function(row) {
                        assert.ok(row.bank === 'Santander', JSON.stringify(row));
                    });

                    done();
                });
            });
        });
    });
});
