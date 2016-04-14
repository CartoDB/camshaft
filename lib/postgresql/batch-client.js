'use strict';

var request = require('request');
var dot = require('dot');
var hostHeader = dot.template('{{=it.username}}.localhost.lan');
var debug = require('../util/debug')('batch-client');

function BatchClient(endpoint, username, apiKey) {
    this.endpoint = endpoint;
    this.username = username;
    this.apiKey = apiKey;
}

module.exports = BatchClient;

BatchClient.prototype.enqueue = function(queries, callback) {
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
