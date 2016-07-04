'use strict';

var BATCH_API_ENDPOINT = 'http://127.0.0.1:8989/api/v1/sql/job';

function create (override) {
    override = override || {
        db: {},
        batch: {}
    };
    override.db = override.db || {};
    override.batch = override.batch || {};
    return {
        user: override.user || 'localhost',
        db: defaults(override.db, {
            host: 'localhost',
            port: 5432,
            dbname: 'analysis_api_test_db',
            user: 'postgres',
            pass: ''
        }),
        batch: defaults(override.batch, {
            endpoint: BATCH_API_ENDPOINT,
            username: 'localhost',
            apiKey: 1234
        })
    };
}

function defaults (obj, def) {
    Object.keys(def).forEach(function(key) {
        if (!obj.hasOwnProperty(key)) {
            obj[key] = def[key];
        }
    });

    return obj;
}

module.exports = create();

module.exports.create = create;
