'use strict';

var config = require('./environments/development');

if (process.env.NODE_ENV === 'test') {
    config = require('./environments/test');
}

function loadConfig() {
    if (process.env.NODE_ENV === 'test') {
        config = require('./environments/test');
    } else {
        config = require('./environments/development');
    }
}

var lastEnv = process.env.NODE_ENV;

function getConfig() {
    if (lastEnv !== process.env.NODE_ENV) {
        lastEnv = process.env.NODE_ENV;
        loadConfig();
    }
    return config;
}

module.exports = {
    get: function(key, fallback) {
        return getConfig()[key] || fallback;
    }
};
