'use strict';

var assert = require('assert');
var buildQuery = require(__lib + 'node/nodes/buffer/buffer-query-builder');

describe('buffer-query-builder', function() {
    var queryExpected = [
        'SELECT',
        '  cartodb_id, name,',
        '  ST_Buffer(the_geom::geography, 500)::geometry the_geom',
        'FROM (',
        '  select * from wadus',
        ') _camshaft_buffer\n',
    ].join('\n');

    it('should build query properly', function() {
        assert.equal(queryExpected, buildQuery({
            columns: ['cartodb_id', 'name'],
            source: 'select * from wadus',
            radius: 500
        }));
    });
});
