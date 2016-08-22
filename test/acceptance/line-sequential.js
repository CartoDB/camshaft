'use strict';

var assert = require('assert');

var Analysis = require('../../lib/analysis');

var testConfig = require('../test-config');
var QueryRunner = require('../../lib/postgresql/query-runner');

describe('line-sequential analysis', function() {

    var queryRunner;

    before(function() {
        queryRunner = new QueryRunner(testConfig.db);
    });

    var QUERY_SOURCE = 'select * from atm_machines';
    var sourceAtmMachines = {
        type: 'source',
        params: {
            query: QUERY_SOURCE
        }
    };

    var config = testConfig.create({
        batch: {
            inlineExecution: true
        }
    });

    function performAnalysis(definition, callback) {
        Analysis.create(config, definition, function (err, analysis) {
            if (err) {
                return callback(err);
            }

            queryRunner.run(analysis.getQuery(), function(err, result) {
                if (err) {
                    return callback(err);
                }

                assert.ok(Array.isArray(result.rows));
                var values = result.rows.map(function (value) {
                    return value;
                });

                callback(null, values);
            });
        });
    }

    describe('line sequential analysis', function () {
        var lineSequentialDefinition = {
            type: 'line-sequential',
            params: {
                source: sourceAtmMachines,
                order_column: 'bank',
                order_type: 'desc'
            }
        };

        it('should create analysis sequential order by bank desc', function (done) {
            performAnalysis(lineSequentialDefinition, function (err, values) {
                if (err) {
                    return done(err);
                }

                assert.ok(values);
                assert.equal(values.length, 1);
                values.forEach(function (value) {
                    assert.equal(typeof value.cartodb_id, 'number');
                    assert.ok(value.the_geom);
                });
                done();
            });
        });

        it('should create analysis sequential order by bank asc', function (done) {
            lineSequentialDefinition.params.order_type = 'asc';
            performAnalysis(lineSequentialDefinition, function (err, values) {
                if(err) {
                    return done(err);
                }

                assert.ok(values);
                assert.equal(values.length, 1);
                values.forEach(function (value) {
                    assert.equal(typeof value.cartodb_id, 'number');
                    assert.ok(value.the_geom);
                });
                done();
            });
        });

        it('should create analysis sequential order by cartodb_id (by default) asc', function (done) {
            lineSequentialDefinition.params.order_column = undefined;
            performAnalysis(lineSequentialDefinition, function (err, values) {
                if(err) {
                    return done(err);
                }

                assert.ok(values);
                assert.equal(values.length, 1);
                values.forEach(function (value) {
                    assert.equal(typeof value.cartodb_id, 'number');
                    assert.ok(value.the_geom);
                });
                done();
            });
        });

    });
});
