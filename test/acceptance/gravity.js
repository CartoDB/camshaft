'use strict';

var assert = require('assert');

var Analysis = require('../../lib/analysis');

var testConfig = require('../test-config');
var QueryRunner = require('../../lib/postgresql/query-runner');

describe('gravity analysis', function() {

    var queryRunner;

    before(function() {
        queryRunner = new QueryRunner(testConfig.db);
    });

    var sourceAtmMachines = {
        type: 'source',
        params: {
            query: 'select * from atm_machines limit 2'
        }
    };

    var targetAtmMachines = {
        type: 'source',
        params: {
            query: 'select * from atm_machines limit 2 offset 2'
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

    describe('gravity', function () {
        var tradeAreaDefinition = {
            type: 'gravity',
            params: {
                source: sourceAtmMachines,
                target: targetAtmMachines,
                weight_column: 'cartodb_id',
                pop_column: 'cartodb_id',
                max_distance: 500,
                target_id: 1
            }
        };

        it('should create an analysis', function (done) {
            performAnalysis(tradeAreaDefinition, function (err, values) {
                if(err) {
                    return done(err);
                }
                assert.ok(values);
                done();
            });
        });
    });
});
