'use strict';

var assert = require('assert');

var QueryRunner = require('../../lib/postgresql/query-runner');
var QueryParser = require('../../lib/postgresql/query-parser');

var testConfig = require('../test-config');


//select * from (select * from populated_places_simple) _cdb_schema_discovery limit 0;
//
//
//  select * from (
//      select *, ST_Buffer(the_geom_webmercator, 100) the_geom_webmercator FROM (select * from populated_places_simple
//  ) _cdb_orig_query) _cdb_schema_discovery limit 0;
//
//  select *, ST_Buffer(the_geom_webmercator, 100) the_geom_webmercator FROM (
//      select * from populated_places_simple
//  ) _cdb_orig_query;



describe('query-parser', function() {

    var queryParser;

    before(function() {
        var queryRunner = new QueryRunner(testConfig.db);
        queryParser = new QueryParser(queryRunner);
    });

    it('should return a list of columns with name and type for each of them', function(done) {
        var query = 'select cartodb_id, the_geom_webmercator from atm_machines';
        queryParser.getColumns(query, function(err, columns) {
            assert.ok(!err, err);

            assert.deepEqual(columns, [
                {name: 'cartodb_id', type: 'number'},
                {name: 'the_geom_webmercator', type: 'geometry'}
            ]);

            done();
        });
    });

    it('should return a list of columns names', function(done) {
        var query = 'select cartodb_id, the_geom_webmercator from atm_machines';
        queryParser.getColumnNames(query, function(err, columnNames) {
            assert.ok(!err, err);

            assert.deepEqual(columnNames, ['cartodb_id', 'the_geom_webmercator']);

            done();
        });
    });

});
