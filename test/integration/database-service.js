'use strict';

var assert = require('assert');

var Source = require('../../lib/node/nodes/source');
var Buffer = require('../../lib/node/nodes/buffer');

var DatabaseService = require('../../lib/service/database');
var testConfig = require('../test-config');

describe('database-service', function() {

    var SKIP = true;
    var QUERY_QUERYTABLES = 'select * from atm_machines';
    var QUERY_MULTIPLETABLES = 'select * from multiple_tables';
    var QUERY_NO_QUERYTABLES = 'select * from nulltime';

    before(function() {
        this.databaseService = new DatabaseService(testConfig.user, testConfig.db, testConfig.batch);
    });

    it('should return time from CDB_QueryTables_Updated_At', function(done) {
        var source = new Source(testConfig.user, { query: QUERY_QUERYTABLES });
        this.databaseService.getMetadataFromAffectedTables(source, !SKIP, function(err, data) {
            assert.ok(!err, err);
            assert.equal(data.last_update.getTime(), new Date('2016-07-01T11:40:05.699Z').getTime());
            done();
        });
    });

    it('should return a fixed time in the past for tables not found by CDB_QueryTables_Updated_At', function(done) {
        var source = new Source(testConfig.user, { query: QUERY_NO_QUERYTABLES });
        this.databaseService.getMetadataFromAffectedTables(source, !SKIP, function(err, data) {
            assert.ok(!err, err);
            assert.equal(data.last_update.getTime(), new Date('1970-01-01T00:00:00.000Z').getTime());
            done();
        });
    });

    it('should be able to register nodes with null updatedAt', function(done) {
        var source = new Source(testConfig.user, { query: QUERY_QUERYTABLES });
        var sourceWithUpdatedAt = new Source(testConfig.user, { query: QUERY_QUERYTABLES });
        sourceWithUpdatedAt.setUpdatedAt(new Date());
        var analysis = {
            getSortedNodes: function() {
                return [
                    source, source, sourceWithUpdatedAt
                ];
            },
            getRoot: function() {
                return { type: 'wadus' };
            }
        };
        this.databaseService.registerAnalysisInCatalog(analysis, function(err) {
            assert.ok(!err, err);

            done();
        });
    });

    it('should return affected table names for source nodes', function(done) {
        var source = new Source(testConfig.user, { query: QUERY_QUERYTABLES });
        this.databaseService.getMetadataFromAffectedTables(source, !SKIP,
        function(err, data) {
            assert.ok(!err, err);
            data.affected_tables.forEach(function(data) {
                assert.equal(data.schema, 'public');
                assert.equal(data.table, 'atm_machines');
            });
            done();
        });
    });

    it('should return two affected table names for source node', function(done) {
        var source = new Source(testConfig.user, { query: QUERY_MULTIPLETABLES });
        this.databaseService.getMetadataFromAffectedTables(source, !SKIP,
        function(err, data) {
            assert.ok(!err, err);
            assert.equal(data.affected_tables.length, 2);
            assert.equal(data.affected_tables[0].schema, 'public');
            assert.equal(data.affected_tables[0].table, 'table_a');
            assert.equal(data.affected_tables[1].schema, 'public');
            assert.equal(data.affected_tables[1].table, 'table_b');
            assert.equal(data.last_update.getTime(), new Date('2016-07-01T11:40:05.699Z').getTime());
            done();
        });
    });

    it('should return empty affected tables for non-source queries', function(done) {
        var source = new Source(testConfig.user, { query: QUERY_QUERYTABLES });
        var buffer = new Buffer(testConfig.user, {source: source, radius: 100, isolines: 1, dissolved: false});
        this.databaseService.getMetadataFromAffectedTables(buffer, !SKIP,
        function(err, data) {
            assert.ok(!err, err);
            assert.equal(data.affected_tables.length, 0);
            done();
        });
    });

});
