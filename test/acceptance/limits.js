'use strict';

var assert = require('assert');
var testHelper = require('../helper');
var TestConfig = require('../test-config');

describe('cache query limits', function () {
    var sourceDefinition = {
        type: 'source',
        params: {
            query: 'select * from airbnb_rooms'
        }
    };

    var bufferDefinition = {
        type: 'buffer',
        params: {
            source: sourceDefinition,
            radius: 5000
        }
    };

    var tradeAreaDefinition = {
        type: 'trade-area',
        params: {
            source: sourceDefinition,
            kind: 'car',
            time: 900,
            isolines: 3,
            dissolved: false
        }
    };

    function createConfig (limits) {
        return TestConfig.create({
            limits: {
                analyses: limits
            },
            batch: { inlineExecution: true }
        });
    }

    it('should use type timeout', function (done) {
        var config = createConfig({ buffer: { timeout: 1000 } });
        testHelper.createAnalyses(bufferDefinition, config, function (err, bufferResult) {
            assert.ifError(err);
            var rootNode = bufferResult.getRoot();
            assert.equal(rootNode.getStatus(), 'ready');
            assert.equal(rootNode.getCacheQueryTimeout(), 1000);
            return done();
        });
    });

    it('should use tag timeout', function (done) {
        var config = createConfig({ io4x: { timeout: 5000 } });
        testHelper.createAnalyses(tradeAreaDefinition, config, function (err, tradeAreaResult) {
            assert.ok(!err, err);
            var rootNode = tradeAreaResult.getRoot();
            assert.equal(rootNode.getStatus(), 'ready');
            assert.equal(rootNode.getCacheQueryTimeout(), 5000);
            return done();
        });
    });

    it('should use type over tag timeout', function (done) {
        var config = createConfig({ io4x: { timeout: 5000 }, 'trade-area': { timeout: 2000 } });
        testHelper.createAnalyses(tradeAreaDefinition, config, function (err, tradeAreaResult) {
            assert.ok(!err, err);
            var rootNode = tradeAreaResult.getRoot();
            assert.equal(rootNode.getStatus(), 'ready');
            assert.equal(rootNode.getCacheQueryTimeout(), 2000);
            return done();
        });
    });
});
