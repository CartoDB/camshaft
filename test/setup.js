'use strict';

process.env.NODE_ENV = 'test';

var testConfig = require('./test-config');
var exec = require('child_process').exec;
var fs = require('fs');

var async = require('async');

var debug = require('../lib/util/debug')('test-setup');

var DATABASE_NAME = testConfig.db.dbname;

before(function setupTestDatabase(done) {
    var catalogPath = fs.realpathSync('./test/fixtures/cdb_analysis_catalog.sql');
    var isochronePath = fs.realpathSync('./test/fixtures/cdb_isochrone.sql');
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
            function createIsochromeFunction(stdout, stderr, callback) {
                exec('psql -d ' + DATABASE_NAME + ' -f ' + isochronePath, callback);
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
