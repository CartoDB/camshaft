'use strict';

const assert = require('assert');
const testHelper = require('../helper');

describe('moran analysis', function () {
    const QUERY = `
    select
        row_number() over() AS cartodb_id,
        st_setsrid(st_makepoint(x*10, x*10), 4326) as the_geom,
        st_transform(st_setsrid(st_makepoint(x*10, x*10), 4326), 3857) as the_geom_webmercator,
        x as value,
        d as date
    from
        generate_series(-3, 3) x,
        generate_series(
            '2007-02-15 01:00:00'::timestamp, '2007-02-18 01:00:00'::timestamp, '1 day'::interval
        ) d
    `;

    const SIGNIFICANCE = 0.05;

    const sourceAtmMachines = {
        type: 'source',
        params: {
            query: QUERY
        }
    };

    const moranDefinition = {
        type: 'moran',
        params: {
            source: sourceAtmMachines,
            significance: SIGNIFICANCE,
            numerator_column: 'value'
        }
    };

    it.only('should create the moran analyses when the query uses "\'" at some point', function (done) {
        testHelper.createAnalyses(moranDefinition, function(err, moran) {
            assert.ifError(err);

            var rootNode = moran.getRoot();

            testHelper.getRows(rootNode.getQuery(), function(err, rows) {
                assert.ifError(err);
                rows.forEach(row => {
                    assert.ok(typeof row.cartodb_id === 'number');
                    assert.ok(typeof row.the_geom === 'string');
                    assert.ok(typeof row.date === 'number');
                });

                return done();
            });
        });
    });
});
