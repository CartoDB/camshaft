'use strict';

var assert = require('assert');

var Analysis = require('../../lib/analysis');

var testConfig = require('../test-config');
var BatchClient = require('../../lib/postgresql/batch-client');
var QueryRunner = require('../../lib/postgresql/query-runner');

describe('trade-area analysis', function() {

    var queryRunner;
    var enqueueFn;
    var enqueueCalled;

    before(function() {
        queryRunner = new QueryRunner(testConfig.db);
        enqueueFn = BatchClient.prototype.enqueue;
        enqueueCalled = 0;
        BatchClient.prototype.enqueue = function(query, callback) {
            console.log(query);
            enqueueCalled += 1;
            return callback(null, { status: 'ok' });
        };
    });

    after(function () {
        assert.ok(enqueueCalled > 0);
        BatchClient.prototype.enqueue = enqueueFn;
    });

    var QUERY = 'select * from atm_machines';
    var KIND = 'drive';
    var TIME = 600;

    var sourceAtmMachines = {
        type: 'source',
        params: {
            query: QUERY
        }
    };

    function performAnalysis(definition, callback) {
        Analysis.create(testConfig, definition, function (err, analysis) {
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
                time: TIME
            }
        };

        it('should create an analysis and get districts with their average price', function (done) {
            performAnalysis(tradeAreaDefinition, function (err, values) {
                assert.ok(!err, err);
                assert.ok(values);
                done();
            });
        });
    });
});
