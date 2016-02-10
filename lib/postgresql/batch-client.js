'use strict';

var qs = require('querystring');

var request = require('request');

var dot = require('dot');
var hostHeader = dot.template('{{=it.username}}.localhost.lan');

var debug = require('../util/debug')('batch-client');


// TODO this should be configurable
var BATCH_API_ENDPOINT = 'http://127.0.0.1:8080/api/v1/sql/job';

function BatchClient(username, apiKey) {
    this.username = username;
    this.apiKey = apiKey;
}

module.exports = BatchClient;

BatchClient.prototype.enqueue = function(query, callback) {
    var enqueueRequest = {
        url: BATCH_API_ENDPOINT + '?' + qs.stringify({'api_key': this.apiKey}),
        headers: {
            'Content-Type': 'application/json',
            'Host': hostHeader({username: this.username}),
            'User-Agent': 'CartoDB-Analysis-API'
        },
        body: JSON.stringify({query: query})
    };
    request.post(enqueueRequest, function(err, response, body) {
        response = response || {};
        if (err || response.statusCode !== 201) {
            return callback(new Error('Unable to enqueue SQL API batch job'));
        }

        var job = JSON.parse(body);
        debug('Queued job: %j', job);

        return callback(null, {status: 'ok'});
    });
};
