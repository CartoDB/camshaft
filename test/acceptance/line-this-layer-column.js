'use strict';

var assert = require('assert');

var Analysis = require('../../lib/analysis');

var testConfig = require('../test-config');
var QueryRunner = require('../../lib/postgresql/query-runner');

describe('line-this-layer-column analysis', function() {

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

    describe('line this layer column analysis', function () {
        var lineToSinglePointDefinition = {
            type: 'line-this-layer-column',
            params: {
                source: sourceAtmMachines,
                column_target: 'the_geom_target'
            }
        };

        it('should create analysis all to all', function (done) {
            performAnalysis(lineToSinglePointDefinition, function (err, values) {
                if(err) {
                    return done(err);
                }

                assert.ok(values);
                assert.ok(values.length > 0);
                done();
            });
        });
    });
});
