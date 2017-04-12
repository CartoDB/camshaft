'use strict';

var assert = require('assert');
var testHelper = require('../helper');

describe('deprecated-sql-function analysis', function () {

    before(function(done) {
        testHelper.executeQuery([
            'CREATE OR REPLACE FUNCTION test_deprecated_fn(',
            '    query text, a numeric, b numeric, c numeric, d text, table_name text, operation text',
            ')',
            'RETURNS VOID AS $$',
            '    BEGIN',
            '        IF operation = \'create\' THEN',
            '            EXECUTE \'CREATE TABLE \' || table_name || \' ',
            '                (cartodb_id numeric, the_geom geometry, a int, b int, c int)\';',
            '        ELSIF operation = \'populate\' THEN',
            '            EXECUTE \'INSERT INTO \' || table_name || \' ',
            '                SELECT',
            '                    cartodb_id,',
            '                    st_setsrid(st_makepoint(st_x(the_geom) + \' || a || \',',
            '                    st_y(the_geom) + \' || b + c || \'), 4326) the_geom,',
            '                    \' || a || \', \' || b || \', \' || c || \'',
            '                FROM (\' || query || \') _q\';',
            '        END IF;',
            '    END;',
            '$$ LANGUAGE plpgsql;'
        ].join('\n'), done);
    });

    after(function(done) {
        testHelper.executeQuery(
            'DROP FUNCTION test_deprecated_fn(text, numeric, numeric, numeric, text, text, text)',
            done
        );
    });

    var QUERY_SOURCE = [
        'WITH sources AS (',
        '   select i as cartodb_id, st_setsrid(st_makepoint(i,i), 4326) as the_geom',
        '   from generate_series(1,3) as i',
        ')',
        'select *, st_x(the_geom) as x, st_y(the_geom) as y from sources'
    ].join('\n');

    function deprecatedSqlFnDefinition(fnArgs) {
        return {
            type: 'deprecated-sql-function',
            params: {
                function_name: 'test_deprecated_fn',
                primary_source: {
                    type: 'source',
                    params: {
                        query: QUERY_SOURCE
                    }
                },
                function_args: fnArgs || [1, 2, 3, 'wadus'],
            }
        };
    }

    function expectedRows(a, b, c) {
        return [
            {
                cartodb_id: 1,
                a: a,
                b: b,
                c: c,
                st_x: 1 + a,
                st_y: 1 + b + c
            },
            {
                cartodb_id: 2,
                a: a,
                b: b,
                c: c,
                st_x: 2 + a,
                st_y: 2 + b + c
            },
            {
                cartodb_id: 3,
                a: a,
                b: b,
                c: c,
                st_x: 3 + a,
                st_y: 3 + b + c
            },
        ];
    }

    it('happy case', function (done) {
        testHelper.createAnalyses(deprecatedSqlFnDefinition(), function(err, result) {
            assert.ifError(err);
            var query = 'select cartodb_id, a, b, c, st_x(the_geom), st_y(the_geom) from (' +
                result.getRoot().getQuery() +
                ') _q';
            testHelper.getRows(query, function(err, rows) {
                assert.ifError(err);
                assert.equal(rows.length, 3);
                assert.deepEqual(rows, expectedRows(1, 2, 3));
                return done();
            });
        });
    });

    it('change extra args', function (done) {
        var extraArgs = [9, 8, 7, 'wadus'];
        testHelper.createAnalyses(deprecatedSqlFnDefinition(extraArgs), function(err, result) {
            assert.ifError(err);
            var query = 'select cartodb_id, a, b, c, st_x(the_geom), st_y(the_geom) from (' +
                result.getRoot().getQuery() +
                ') _q';
            testHelper.getRows(query, function(err, rows) {
                assert.ifError(err);
                assert.equal(rows.length, 3);
                assert.deepEqual(rows, expectedRows.apply(null, extraArgs));
                return done();
            });
        });
    });

});
