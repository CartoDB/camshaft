'use strict';

var assert = require('assert');
var buildQuery = require(__lib + 'node/nodes/population-in-area/population-in-area-query-builder');

describe('population-in-area-query-builder', function() {
    var queryExpected = [
        'SELECT',
        '  cartodb_id, name,',
        '  CDB_Population(the_geom) as the_geom',
        'FROM (',
        '  select * from wadus',
        ') _camshaft_population_in_area\n',
    ].join('\n');

    it('should build query properly', function() {
        assert.equal(queryExpected, buildQuery({
            columns: ['cartodb_id', 'name'],
            source: 'select * from wadus',
            final_column: 'the_geom'
        }));
    });
});
