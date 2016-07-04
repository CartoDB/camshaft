'use strict';

process.env.NODE_ENV = 'test';

var testConfig = require('./test-config');
var exec = require('child_process').exec;
var fs = require('fs');

var async = require('async');

var debug = require('../lib/util/debug')('test-setup');

var DATABASE_NAME = testConfig.db.dbname;

before(function setupTestDatabase(done) {
    var fixturePaths = [
        fs.realpathSync('./test/fixtures/cdb_querytables_updated_at.sql'),
        fs.realpathSync('./test/fixtures/cdb_analysis_catalog.sql'),
        fs.realpathSync('./test/fixtures/cdb_isochrone.sql'),
        fs.realpathSync('./test/fixtures/atm_machines.sql'),
        fs.realpathSync('./test/fixtures/madrid_districts.sql'),
        fs.realpathSync('./test/fixtures/airbnb_rooms.sql'),
        fs.realpathSync('./test/fixtures/obs_getmeasure.sql'),
        fs.realpathSync('./test/fixtures/cdb_route_point_to_point.sql')
    ];

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
            function createDataServicesClientSchema(stdout, stderr, callback) {
                var command = 'psql -d ' + DATABASE_NAME + ' -c "CREATE SCHEMA IF NOT EXISTS cdb_dataservices_client;"';
                exec(command, callback);
            },
            function applyFixtures(stdout, stderr, callback) {
                async.map(fixturePaths, function (path, callback) {
                    exec('psql -d ' + DATABASE_NAME + ' -f ' + path, callback);
                }, callback);
            }
        ],
        function finish(err, results) {
            debug('Test database setup, results: %j', results);
            done(err);
        }
    );
});
