'use strict';

var assert = require('assert');
var async = require('async');

var Analysis = require('../../lib/analysis');

var TestConfig = require('../test-config');
var QueryRunner = require('../../lib/postgresql/query-runner');


describe('cached nodes', function() {

    var queryRunner;

    before(function() {
        this.testConfig = TestConfig.create({ batch: { inlineExecution: true } });

        this.createAnalysis = function(definition, callback) {
            Analysis.create(this.testConfig, definition, callback);
        };

        queryRunner = new QueryRunner(this.testConfig.db);
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

    function rankDefinition(source) {
        return {
            type: 'filter-rank',
            params: {
                source: source || sourceAnalysisDefinition,
                column: 'bank',
                rank: 'bottom',
                limit: 3
            }
        };
    }

    var sourceFilters = {
        bank_category: {
            type: 'category',
            column: 'bank',
            params: {
                reject: ['BBVA']
            }
        }
    };

    var rankFilters = {
        bank_category: {
            type: 'category',
            column: 'bank',
            params: {
                reject: ['BBVA']
            }
        }
    };

    it('should return just BBVA and ING banks from rank', function(done) {
        Analysis.create(this.testConfig, rankDefinition(), function(err, analysis) {
            assert.ok(!err, err);

            getRows(analysis.getQuery(), function(err, rows) {
                assert.ok(!err, err);

                var banks = rows.map(function(row) {
                    return row.bank;
                });
                var BANKS_SORTED_THREE = ['BBVA', 'BBVA', 'ING'];

                assert.deepEqual(banks, BANKS_SORTED_THREE);

                done();
            });

        });
    });

    it('should have different id when filter is applied: source and rank', function(done) {
        var filteredSource = filteredNodeDefinition(sourceAnalysisDefinition, sourceFilters);
        var analyses = [rankDefinition(), rankDefinition(filteredSource)];

        async.map(analyses, this.createAnalysis.bind(this), function(err, results) {
            assert.ok(!err, err);

            assert.equal(results.length, 2);
            var rawAnalysis = results[0];
            var filteredAnalysis = results[1];

            assert.notEqual(rawAnalysis.id(), filteredAnalysis.id());

            var rawNodes = rawAnalysis.getNodes();
            var filteredNodes = filteredAnalysis.getNodes();

            rawNodes.forEach(function(node, index) {
                assert.equal(node.type, filteredNodes[index].type);
                assert.notEqual(node.id(), filteredNodes[index].id());
                assert.notEqual(node.getQuery(), filteredNodes[index].getQuery());
            });

            assert.notEqual(results[0].getQuery(), results[1].getQuery());

            getRows(results[1].getQuery(), function(err, rows) {
                assert.ok(!err, err);

                var banks = rows.map(function(row) {
                    return row.bank;
                });
                var BANKS_SORTED_THREE_BBVA_SKIPPED = ['ING', 'Santander', 'Santander'];

                assert.deepEqual(banks, BANKS_SORTED_THREE_BBVA_SKIPPED);

                done();
            });
        });
    });

    describe('cached table', function() {

        var rawAnalysis;
        var filteredAnalysis;
        before(function(done) {
            var filteredRank = filteredNodeDefinition(rankDefinition(), rankFilters);
            var analyses = [rankDefinition(), filteredRank];

            async.map(analyses, this.createAnalysis.bind(this), function(err, results) {
                if (err) {
                    return done(err);
                }

                assert.equal(results.length, 2);

                rawAnalysis = results[0];
                filteredAnalysis = results[1];

                return done();
            });
        });

        it('should have same source id, different rank id', function() {
            assert.notEqual(rawAnalysis.id(), filteredAnalysis.id());

            var rawNodes = rawAnalysis.getNodes();
            var filteredNodes = filteredAnalysis.getNodes();

            var rawSourceNode = rawNodes[1];
            var filteredSourceNode = filteredNodes[1];
            assert.equal(rawSourceNode.type, filteredSourceNode.type);
            assert.equal(rawSourceNode.id(), filteredSourceNode.id());

            var rawRankNode = rawNodes[0];
            var filteredRankNode = filteredNodes[0];
            assert.equal(rawRankNode.type, filteredRankNode.type);
            assert.notEqual(rawRankNode.id(), filteredRankNode.id());
            assert.notEqual(rawRankNode.getQuery(), filteredRankNode.getQuery());
        });

        it('should return just ING as BBVA is filtered at rank (not at source)', function(done) {
            getRows(filteredAnalysis.getQuery(), function(err, rows) {
                assert.ok(!err, err);

                var banks = rows.map(function(row) {
                    return row.bank;
                });
                var BANKS_SORTED_THREE_BBVA_SKIPPED = ['ING'];

                assert.deepEqual(banks, BANKS_SORTED_THREE_BBVA_SKIPPED);

                done();
            });
        });

        it('should return just ING and BBVA when filter is switch off', function(done) {
            var filteredRankNode = filteredAnalysis.getRoot();
            getRows(filteredRankNode.getQuery({ bank_category: false }), function(err, rows) {
                assert.ok(!err, err);

                var banks = rows.map(function(row) {
                    return row.bank;
                });
                var BANKS_SORTED_THREE_BBVA_SKIPPED = ['BBVA', 'BBVA', 'ING'];

                assert.deepEqual(banks, BANKS_SORTED_THREE_BBVA_SKIPPED);

                done();
            });
        });

        it('should return same result for rank and filtered when unfiltering', function(done) {
            var rawRankNode = rawAnalysis.getRoot();
            var filteredRankNode = filteredAnalysis.getRoot();

            var queries = [
                rawRankNode.getQuery(),
                filteredRankNode.getQuery({ bank_category: false })
            ];
            async.map(queries, getRows, function(err, results) {
                if (err) {
                    return done(err);
                }

                assert.equal(results.length, 2);
                assert.deepEqual(results[0], results[1]);

                done();
            });
        });

        it('should use same table as rank unfiltered but with the filter applied over unfiltered version', function() {
            var rawRankNode = rawAnalysis.getRoot();
            var filteredRankNode = filteredAnalysis.getRoot();
            assert.equal(rawRankNode.getTargetTable(), filteredRankNode.getTargetTable());
            assert.equal(rawRankNode.getQuery(), filteredRankNode.getQuery({ bank_category: false }));
            assert.notEqual(rawRankNode.getQuery(), filteredRankNode.getQuery());
        });
    });

});
