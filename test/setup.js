'use strict';

process.env.NODE_ENV = 'test';
var config = require('../config/index');
var UserConfigurationFixture = require('./fixtures/user-configuration');
var exec = require('child_process').exec;
var fs = require('fs');

var async = require('async');

var debug = require('../lib/util/debug')('test-setup');

var redis = require('redis');
var spawn = require('child_process').spawn;

var DATABASE_NAME = UserConfigurationFixture.dbParams.dbname;

var redisServer;

before(function startRedisServer(done) {
    var redisPort = config.get('redis').port;
    debug('starting redis port=%d', redisPort);
    redisServer = spawn('redis-server', ['--port', redisPort]);
    redisServer.on('end', function (code) {
        debug('child process terminated due to receipt of signal=%d', code);
    });
    redisServer.unref();
    var redisServerStarted = false;
    redisServer.stdout.on('data', function() {
        if (!redisServerStarted) {
            redisServerStarted = true;

            var redisClient = redis.createClient(redisPort);
            redisClient.multi()
                .select(5)
                .hmset('rails:users:' + UserConfigurationFixture.username, {
                    'id': 1,
                    'database_name': DATABASE_NAME,
                    'database_host': UserConfigurationFixture.dbParams.host,
                    'map_key': UserConfigurationFixture.apiKey
                })
                .exec(done);
        }
    });
});

before(function setupTestDatabase(done) {
    var catalogPath = fs.realpathSync('./test/fixtures/cdb_analysis_catalog.sql');
    var fixturesPath = fs.realpathSync('./test/fixtures/atm_machines.sql');
    async.waterfall(
        [
            function dropDatabaseIfExists(callback) {
                exec('dropdb ' + DATABASE_NAME, function(/*ignore error*/) {
                    return callback(null);
                });
            },
            function createDatabase(callback) {
                exec('createdb -EUTF8 ' + DATABASE_NAME, callback);
            },
            function createPostgisExtension(stdout, stderr, callback) {
                exec('psql -d ' + DATABASE_NAME + ' -c "CREATE EXTENSION postgis;"', callback);
            },
            function createCatalogTable(stdout, stderr, callback) {
                exec('psql -d ' + DATABASE_NAME + ' -f ' + catalogPath, callback);
            },
            function applyFixtures(stdout, stderr, callback) {
                exec('psql -d ' + DATABASE_NAME + ' -f ' + fixturesPath, callback);
            }
        ],
        function finish(err, results) {
            debug('Test database setup, results: %j', results);
            done(err);
        }
    );
});


after(function stopRedisServer(done) {
    redisServer.kill('SIGINT');
    done();
});

