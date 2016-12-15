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
        fs.realpathSync('./test/fixtures/postgis_extension.sql'),
        fs.realpathSync('./test/fixtures/cdb_querytables_updated_at.sql'),
        fs.realpathSync('./test/fixtures/cdb_analysis_catalog.sql'),
        fs.realpathSync('./test/fixtures/cdb_analysischeck.sql'),

        fs.realpathSync('./test/fixtures/cdb_dataservices_client/schema.sql'),
        fs.realpathSync('./test/fixtures/cdb_dataservices_client/cdb_geocoder.sql'),
        fs.realpathSync('./test/fixtures/cdb_dataservices_client/cdb_isochrone.sql'),
        fs.realpathSync('./test/fixtures/cdb_dataservices_client/cdb_route_point_to_point.sql'),
        fs.realpathSync('./test/fixtures/cdb_dataservices_client/cdb_route_with_waypoints.sql'),
        fs.realpathSync('./test/fixtures/cdb_dataservices_client/obs_getmeasure.sql'),

        fs.realpathSync('./test/fixtures/cdb_crankshaft/schema.sql'),
        fs.realpathSync('./test/fixtures/cdb_crankshaft/cdb_kmeans.sql'),
        fs.realpathSync('./test/fixtures/cdb_crankshaft/cdb_gravity.sql'),
        fs.realpathSync('./test/fixtures/cdb_crankshaft/cdb_contour.sql'),

        fs.realpathSync('./test/fixtures/table/madrid_districts.sql'),
        fs.realpathSync('./test/fixtures/table/atm_machines.sql'),
        fs.realpathSync('./test/fixtures/table/airbnb_rooms.sql'),
        fs.realpathSync('./test/fixtures/table/postal_codes.sql')
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
            function applyFixtures(stdout, stderr, callback) {
                async.eachSeries(fixturePaths, function (path, callback) {
                    debug('Loading SQL script: %s', path);
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
