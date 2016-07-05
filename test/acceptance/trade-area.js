'use strict';

var assert = require('assert');

var Analysis = require('../../lib/analysis');

var testConfig = require('../test-config');
var QueryRunner = require('../../lib/postgresql/query-runner');

describe('trade-area analysis', function() {

    var queryRunner;

    before(function() {
        queryRunner = new QueryRunner(testConfig.db);
    });

    var QUERY = 'select * from atm_machines limit 2';
    var KIND = 'car';
    var TIME = 600;
    var ISOLINES = 4;

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

    describe('trade area analysis', function () {
        var tradeAreaDefinition = {
            type: 'trade-area',
            params: {
                source: sourceAtmMachines,
                kind: KIND,
                time: TIME,
                isolines: ISOLINES,
                dissolved: false
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

    describe('trade area analysis dissolved', function () {
        var tradeAreaDefinition = {
            type: 'trade-area',
            params: {
                source: sourceAtmMachines,
                kind: KIND,
                time: TIME,
                isolines: ISOLINES,
                dissolved: true
            }
        };

        it('should create an analysis with boudaries dissolved', function (done) {
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
