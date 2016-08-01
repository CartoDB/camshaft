'use strict';

var assert = require('assert');

var Source = require('../../lib/node/nodes/source');

var DatabaseService = require('../../lib/service/database');
var testConfig = require('../test-config');

describe('database-servie', function() {

    var SKIP = true;
    var QUERY_QUERYTABLES = 'select * from atm_machines';
    var QUERY_NO_QUERYTABLES = 'select * from nulltime';

    before(function() {
        this.databaseService = new DatabaseService(testConfig.user, testConfig.db, testConfig.batch);
    });

    it('should return time from CDB_QueryTables_Updated_At', function(done) {
        var source = new Source(testConfig.user, { query: QUERY_QUERYTABLES });
        this.databaseService.getLastUpdatedTimeFromAffectedTables(source, !SKIP, function(err, lastUpdatedTime) {
            assert.ok(!err, err);
            assert.equal(lastUpdatedTime.getTime(), new Date('2016-07-01T11:40:05.699Z').getTime());
            done();
        });
    });

    it('should return a fixed time in the past for tables not found by CDB_QueryTables_Updated_At', function(done) {
        var source = new Source(testConfig.user, { query: QUERY_NO_QUERYTABLES });
        this.databaseService.getLastUpdatedTimeFromAffectedTables(source, !SKIP, function(err, lastUpdatedTime) {
            assert.ok(!err, err);
            assert.equal(lastUpdatedTime.getTime(), new Date('1970-01-01T00:00:00.000Z').getTime());
            done();
        });
    });

});
