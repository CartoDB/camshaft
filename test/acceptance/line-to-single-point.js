'use strict';

var assert = require('assert');

var Analysis = require('../../lib/analysis');

var testConfig = require('../test-config');
var QueryRunner = require('../../lib/postgresql/query-runner');

describe('line-to-single-point analysis', function() {

    var queryRunner;

    before(function() {
        queryRunner = new QueryRunner(testConfig.db);
    });

    var QUERY = 'select * from atm_machines limit 2';

    var sourceAtmMachines = {
        type: 'source',
        params: {
            query: QUERY
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

    describe('line to single point analysis', function () {
        var lineToSinglePointDefinition = {
            type: 'line-to-single-point',
            params: {
                source: sourceAtmMachines,
                destination_longitude: -3.66909027,
                destination_latitude: 40.43989237
            }
        };

        it('should create analysis', function (done) {
            performAnalysis(lineToSinglePointDefinition, function (err, values) {
                if(err) {
                    return done(err);
                }
                assert.ok(values);
                done();
            });
        });
    });
});
