'use strict';

var dot = require('dot');
var metadataBackend = require('cartodb-redis');

var dbUser = dot.template('development_cartodb_user_{{=it.userId}}');

module.exports = {
    getConfiguration: function(username, callback) {
        metadataBackend({ port: 6379 }).getAllUserDBParams(username, function(err, dbParams) {
            if (err) {
                return callback(err);
            }

            return callback(null, {
                db: {
                    host: dbParams.dbhost,
                    port: 5432,
                    dbname: dbParams.dbname,
                    user: dbUser({userId: dbParams.dbuser}),
                    pass: dbParams.dbpass
                },
                batch: {
                    username: username,
                    endpoint: 'http://127.0.0.1:8080/api/v1/sql/job',
                    apiKey: dbParams.apikey
                }
            });
        });
    }
};
