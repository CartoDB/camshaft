'use strict';

var async = require('async');
var request = require('request');
var dot = require('dot');
var hostHeader = dot.template('{{=it.username}}.localhost.lan');
var debug = require('../util/debug')('batch-client');

function BatchClient(endpoint, username, apiKey, inlineExecution, queryRunner) {
    this.endpoint = endpoint;
    this.username = username;
    this.apiKey = apiKey;

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
            'Host': hostHeader({username: this.username}),
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
        queries,
        function(query, done) {
            queryRunner.run(query, false, done);
        },
        function finish(err, results) {
            if (err) {
                return callback(new Error('Unable to run query'));
            }

            return callback(null, results);
        }
    );
}