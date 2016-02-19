'use strict';

var qs = require('querystring');

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

BatchClient.prototype.enqueue = function(query, callback) {
    var enqueueRequest = {
        url: this.endpoint + '?' + qs.stringify({'api_key': this.apiKey}),
        headers: {
            'Content-Type': 'application/json',
            'Host': hostHeader({username: this.username}),
            'User-Agent': 'camshaft'
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
