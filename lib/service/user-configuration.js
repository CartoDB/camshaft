'use strict';

var debug = require('../util/debug')('user-configuration');

var config = require('../../config/index');

var metadataBackend = require('cartodb-redis');

var dot = require('dot');

var postgresConfig = config.get('postgres', {});
var dbUser = dot.template(postgresConfig.template.user || 'development_cartodb_user_{{=it.userId}}');
var dbPass = dot.template(postgresConfig.template.pass || '{{=it.userPass}}');

function UserConfigurationService() {
    var redisOpts = config.get('redis', {});
    debug('Using redis port=%d', redisOpts.port);
    this.metadataBackend = metadataBackend({port: redisOpts.port});
}

module.exports = UserConfigurationService;

UserConfigurationService.prototype.getConfiguration = function(username, callback) {
    this.metadataBackend.getAllUserDBParams(username, function(err, dbParams) {
        if (err) {
            return callback(err);
        }

        return callback(null, {
            db: {
                host: dbParams.dbhost,
                port: 5432,
                dbname: dbParams.dbname,
                user: dbUser({userId: dbParams.dbuser}),
                pass: dbPass({userPass: dbParams.dbpass})
            },
            api: {
                apiKey: dbParams.apikey
            }
        });
    });
};
