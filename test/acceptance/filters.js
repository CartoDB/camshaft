'use strict';

var assert = require('assert');
var testHelper = require('../helper');


describe('filters', function() {

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
        testHelper.createAnalyses(sourceAnalysisDefinition, function(err, analysis) {
            assert.ok(!err, err);

            testHelper.getRows(analysis.getQuery(), function(err, rows) {
                assert.ok(!err, err);

                var banks = rows.map(function(row) {
                    return row.bank;
                });

                assert.deepEqual(banks, BANKS_ALL);

                done();
            });

        });
    });

    var filters = {
        bank_category: {
            type: 'category',
            column: 'bank',
            params: {
                accept: ['BBVA']
            }
        }
    };

    it('should return just BBVA banks as they are filtered', function(done) {
        var filteredSource = filteredNodeDefinition(sourceAnalysisDefinition, filters);
        testHelper.createAnalyses(filteredSource, function(err, analysis) {
            assert.ok(!err, err);

            assert.deepEqual(analysis.getRoot().getFilters(), filters);

            testHelper.getRows(analysis.getQuery(), function(err, rows) {
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
        var filteredSource = filteredNodeDefinition(sourceAnalysisDefinition, filters);
        testHelper.createAnalyses(filteredSource, function(err, analysis) {
            assert.ok(!err, err);

            testHelper.getRows(analysis.getRoot().getQuery({bank_category: false}), function(err, rows) {
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
        var filteredSource = filteredNodeDefinition(sourceAnalysisDefinition, filters);

        var tradeAreaAnalysisDefinition = {
            type: 'buffer',
            params: {
                source: filteredSource,
                radius: 5000
            }
        };

        testHelper.createAnalyses(tradeAreaAnalysisDefinition, function(err, analysis) {
            assert.ok(!err, err);

            testHelper.getRows(analysis.getRoot().getQuery(), function(err, rows) {
                assert.ok(!err, err);

                var banks = rows.map(function(row) {
                    return row.bank;
                });

                assert.deepEqual(banks, BANKS_BBVA);

                done();
            });
        });
    });

    var booleanFilter = {
        bank_category: {
            type: 'category',
            column: 'indoor',
            params: {
                accept: [true]
            }
        }
    };

    it('should filter using boolean values', function(done) {
        var indoorAtms = ['BBVA', 'BBVA', 'ING'];
        var filteredSource = filteredNodeDefinition(sourceAnalysisDefinition, booleanFilter);
        testHelper.createAnalyses(filteredSource, function(err, analysis) {
            assert.ok(!err, err);

            testHelper.getRows(analysis.getRoot().getQuery(), function(err, rows) {
                assert.ok(!err, err);

                var banks = rows.map(function(row) {
                    return row.bank;
                });

                assert.deepEqual(banks, indoorAtms);

                done();
            });
        });
    });

    describe('node-id', function() {

        it('should have different id when filter is applied', function(done) {
            var filteredSource = filteredNodeDefinition(sourceAnalysisDefinition, filters);

            testHelper.createAnalyses([sourceAnalysisDefinition, filteredSource], function(err, results) {
                assert.ok(!err, err);

                assert.equal(results.length, 2);
                assert.notEqual(results[0].id(), results[1].id());
                assert.notEqual(results[0].getQuery(), results[1].getQuery());

                done();
            });
        });

    });

});
