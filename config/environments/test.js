'use strict';
var development = require('./development');

var config = JSON.parse(JSON.stringify(development));

config.redis.port = 36379;

config.postgres.template = {
    user: 'postgres',
    pass: ''
};

module.exports = config;
