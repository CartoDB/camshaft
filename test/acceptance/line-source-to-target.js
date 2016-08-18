'use strict';

var assert = require('assert');

var Analysis = require('../../lib/analysis');

var testConfig = require('../test-config');
var QueryRunner = require('../../lib/postgresql/query-runner');

describe('line-source-to-target analysis', function() {

    var queryRunner;

    before(function() {
        queryRunner = new QueryRunner(testConfig.db);
    });

    var QUERY_SOURCE = 'select * from atm_machines where bank = \'Santander\'';
    var sourceAtmMachines = {
        type: 'source',
        params: {
            query: QUERY_SOURCE
        }
    };

    var QUERY_TARGET = 'select * from atm_machines where bank = \'BBVA\'';
    var targetAtmMachines = {
        type: 'source',
        params: {
            query: QUERY_TARGET
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

    describe('line source to target analysis', function () {
        var lineToLayerAllToAllDefinition = {
            type: 'line-source-to-target',
            params: {
                source: sourceAtmMachines,
                source_column: 'kind',
                target: targetAtmMachines,
                target_column: 'kind',
                closest: false
            }
        };

        it('should create analysis', function (done) {
            performAnalysis(lineToLayerAllToAllDefinition, function (err, values) {
                if(err) {
                    return done(err);
                }

                assert.ok(values);
                assert.equal(values.length, 3);
                values.forEach(function (value) {
                    assert.ok(value.length);
                    assert.equal(value.bank, 'Santander');
                });
                done();
            });
        });

        it('should create analysis to the closest', function (done) {
            lineToLayerAllToAllDefinition.params.closest = true;
            performAnalysis(lineToLayerAllToAllDefinition, function (err, values) {
                if(err) {
                    return done(err);
                }

                assert.ok(values);
                assert.equal(values.length, 2);
                values.forEach(function (value) {
                    assert.ok(value.length);
                    assert.equal(value.bank, 'Santander');
                });
                done();
            });
        });

    });
});
