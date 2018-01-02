'use strict';

var assert = require('assert');
var Source = require('../../../lib/node/nodes/source');
var Merge = require('../../../lib/node/nodes/merge');

describe('merge', function() {
    var owner = 'localhost';
    var leftSource = new Source(owner, {
        query: `
            select
                x as cartodb_id,
                st_setsrid(st_makepoint(x*10, x*10), 4326) as the_geom,
                st_transform(st_setsrid(st_makepoint(x*10, x*10), 4326), 3857) as the_geom_webmercator,
                x as value
            from generate_series(0, 9) x
        `
    });

    var rightSource = new Source(owner, {
        query: `
            select
                x as cartodb_id,
                st_setsrid(st_makepoint(x*10, x*10*(-1)), 4326) as the_geom,
                st_transform(st_setsrid(st_makepoint(x*10, x*10*(-1)), 4326), 3857) as the_geom_webmercator,
                x*x as sqrt_value
            from generate_series(0, 4) x
        `
    });

    it('should generate sql', function() {
        var merge = new Merge(owner, {
            left_source: leftSource,
            left_source_column: 'value',
            left_source_columns: ['cartodb_id'],
            right_source: rightSource,
            right_source_column: 'value',
            right_source_columns: ['sqrt_value'],
        });

        assert.equal(merge.cacheQuery, true);
    });
});
