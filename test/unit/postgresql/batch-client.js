'use strict';


var assert = require('assert');
var batchConfig = require('../../test-config').batch;
var endpoint = batchConfig.endpoint;
var username = batchConfig.username;
var apiKey = batchConfig.apiKey;

describe('batch-client-postgresql', function () {

    var scenarios = [{
        title: 'when Batch API works',
        fakeRequest: {
            post: function (opts, callback) {
                return callback(null, { statusCode: 201 }, {
                    job_id: 'wadus',
                    query: opts.body.query,
                    status: 'pending'
                });
            }
        },
        testCase: 'should enqueue a query',
        assert: function (err, result) {
            assert.ok(!err, err);
            assert.deepEqual(result, {status: 'ok'});
        }
    }, {
        title: 'when Batch API does not work',
        fakeRequest: {
            post: function (opts, callback) {
                return callback(new Error('something went wrong'));
            }
        },
        testCase: 'should return an error',
        assert: function (err, result) {
            assert.ok(err, err);
            assert.ok(!result, result);
        }
    }];

    scenarios.forEach(function (scenario) {
        require('request'); // force cache module

        var requestOriginal;
        var requestPath = require.resolve('request');

        describe(scenario.title, function () {
            beforeEach(function () {
                requestOriginal = require.cache[requestPath].exports;
                require.cache[requestPath].exports = scenario.fakeRequest;

                delete require.cache[require.resolve('../../../lib/postgresql/batch-client')];

                var BatchClient = require('../../../lib/postgresql/batch-client');

                this.batchClient = new BatchClient(endpoint, username, apiKey);
            });

            afterEach(function () {
                require.cache[requestPath].exports = requestOriginal;
            });

            it(scenario.testCase, function (done) {
                this.batchClient.enqueue('select * from populated_places', function (err, result) {
                    scenario.assert(err, result);
                    done();
                });
            });
        });
    });
});
