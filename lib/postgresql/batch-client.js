'use strict';

var async = require('async');
var request = require('request');
var dot = require('dot');
var debug = require('../util/debug')('batch-client');

function BatchClient(endpoint, username, apiKey, hostHeaderTemplate, inlineExecution, queryRunner) {
    this.endpoint = endpoint;
    this.username = username;
    this.apiKey = apiKey;
    this.hostHeader = dot.template(hostHeaderTemplate || '{{=it.username}}.localhost.lan');

    this.inlineExecution = inlineExecution || false;
    this.queryRunner = queryRunner;
}

module.exports = BatchClient;

BatchClient.prototype.enqueue = function(queries, callback) {
    if (this.inlineExecution === true) {
        return runQueries(this.queryRunner, queries, callback);
    }

    var enqueueRequest = {
        json: true,
        url: this.endpoint,
        qs: {'api_key': this.apiKey},
        headers: {
            'Host': this.hostHeader({username: this.username}),
            'User-Agent': 'camshaft'
        },
        body: {query: queries}
    };
    request.post(enqueueRequest, function(err, response, job) {
        response = response || {};
        if (err || response.statusCode !== 201) {
            return callback(new Error('Unable to enqueue SQL API batch job'));
        }

        debug('Queued job: %j', job);

        return callback(null, {status: 'ok'});
    });
};

function runQueries(queryRunner, queries, callback) {
    if (!queryRunner || !queryRunner.run) {
        return callback(new Error('BatchClient inline execution requires a valid QueryRunner instance'));
    }

    async.eachSeries(
        queries.query,
        function(query, done) {
            if (typeof query === 'string') {
                return queryRunner.run(query, false, done);
            }

            queryRunner.run(query.query, false, function (err) {
                if (err) {
                    if (query.onerror) {
                        return queryRunner.run(query.onerror, false, done);
                    }

                    return done(err);
                }

                if (query.onsuccess) {
                    return queryRunner.run(query.onsuccess, false, done);
                }

                done();
            });
        },
        function finish(err, results) {
            if (err) {
                if (queries.onerror) {
                    return queryRunner.run(queries.onerror, false, function () {
                        callback(new Error('Unable to run query'));
                    });
                }
                return callback(new Error('Unable to run query'));
            }

            if (queries.onsuccess) {
                return queryRunner.run(queries.onsuccess, false, function () {
                    callback(null, results);
                });
            }

            return callback(null, results);
        }
    );
}
