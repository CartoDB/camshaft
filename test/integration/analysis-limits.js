'use strict';

var assert = require('assert');

var Analysis = require('../../lib/analysis');

var BatchClient = require('../../lib/postgresql/batch-client');

var testConfig = require('../test-config');

describe('workflow', function () {
    describe('create', function () {
        var QUERY_ATM_MACHINES = 'select * from atm_machines';
        var TRADE_AREA_WALK = 'walk';
        var TRADE_AREA_15M = 900;
        var ISOLINES = 4;
        var DISSOLVED = false;

        var sourceAnalysisDefinition = {
            type: 'source',
            params: {
                query: QUERY_ATM_MACHINES
            }
        };

        var tradeAreaAnalysisDefinition = {
            type: 'trade-area',
            params: {
                source: sourceAnalysisDefinition,
                kind: TRADE_AREA_WALK,
                time: TRADE_AREA_15M,
                isolines: ISOLINES,
                dissolved: DISSOLVED
            }
        };

        it('should abort analysis over the limits for source', function (done) {
            var limitedConfig = testConfig.create({
                limits: {
                    analyses: {
                        source: {
                            maximumNumberOfRows: 5
                        }
                    }
                }
            });
            Analysis.create(limitedConfig, sourceAnalysisDefinition, function (err) {
                assert.ok(err);
                done();
            });
        });

        it('source analysis has no limit by default', function (done) {
            Analysis.create(testConfig, sourceAnalysisDefinition, function (err) {
                assert.ok(!err, err);
                done();
            });
        });

        it('should abort analysis over the limits for trade areas', function (done) {
            var limitedConfig = testConfig.create({
                limits: {
                    analyses: {
                        'trade-area': {
                            maximumNumberOfRows: 5
                        }
                    }
                }
            });

            var enqueueFn = BatchClient.prototype.enqueue;
            BatchClient.prototype.enqueue = function (query, callback) {
                return callback(null, { status: 'ok' });
            };

            Analysis.create(limitedConfig, tradeAreaAnalysisDefinition, function (err) {
                BatchClient.prototype.enqueue = enqueueFn;

                assert.ok(err);
                done();
            });
        });
    });
});
