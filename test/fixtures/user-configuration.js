'use strict';
var config = require('../../config');

module.exports = {
    username: 'localhost',
    apiKey: 1234,
    dbParams: {
        user: config.get('postgres').template.user,
        pass: '',
        host: 'localhost',
        port: 5432,
        dbname: 'analysis_api_test_db'
    }
};