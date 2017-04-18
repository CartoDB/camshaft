'use strict';

var assert = require('assert');
var testHelper = require('../helper');

describe('deprecated-sql-function analysis', function () {
    var QUERY_SOURCE = [
        'WITH sources AS (',
        '   select i as cartodb_id, st_setsrid(st_makepoint(i,i), 4326) as the_geom',
        '   from generate_series(1,3) as i',
        ')',
        'select *, st_x(the_geom) as x, st_y(the_geom) as y from sources'
    ].join('\n');

    describe('basics', function() {
        before(function(done) {
            testHelper.executeQuery([
                'CREATE OR REPLACE FUNCTION DEP_EXT_test_deprecated_fn(',
                '    query text, columns text[], a numeric, b numeric, c numeric, d text, table_name text, operation text',
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
                'DROP FUNCTION DEP_EXT_test_deprecated_fn(text, text[], numeric, numeric, numeric, text, text, text)',
                done
            );
        });

        function deprecatedSqlFnDefinition(fnArgs) {
            return {
                type: 'deprecated-sql-function',
                params: {
                    function_name: 'DEP_EXT_test_deprecated_fn',
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

    describe('invalid schema', function() {

        function createInvalidDeprecatedFunctionQuery(fnName, tableColumns) {
            var tKeys = Object.keys(tableColumns);
            var sep = (tKeys.length > 0) ? ',' : '';
            var columns = tKeys.map(function(c) { return tableColumns[c]; }).join(',') + sep;
            var selectAsColumns = tKeys.map(function(c) { return c; }).join(',') + sep;
            return [
                'CREATE OR REPLACE FUNCTION ' + fnName + '(',
                '    query text, columns text[], buster numeric, table_name text, operation text',
                ')',
                'RETURNS VOID AS $$',
                '    BEGIN',
                '        IF operation = \'create\' THEN',
                '            EXECUTE \'CREATE TABLE \' || table_name || \' (', columns, 'a int, b int, c int)\';',
                '        ELSIF operation = \'populate\' THEN',
                '            EXECUTE \'INSERT INTO \' || table_name || \' ',
                '                SELECT', selectAsColumns, '1 as a, 2 as b, 3 as c',
                '                FROM (\' || query || \') _q\';',
                '        END IF;',
                '    END;',
                '$$ LANGUAGE plpgsql;'
            ].join('\n');
        }

        function invalidSchemaDeprecatedSqlFnDefinition(fnName, buster) {
            return {
                type: 'deprecated-sql-function',
                params: {
                    function_name: fnName,
                    primary_source: {
                        type: 'source',
                        params: {
                            query: QUERY_SOURCE
                        }
                    },
                    function_args: [buster]
                }
            };
        }

        function mandatoryColumns() {
            return {
                cartodb_id: 'cartodb_id numeric',
                the_geom: 'the_geom geometry'
            };
        }

        describe('missing columns', function() {
            var fnName = 'DEP_EXT_test_deprecated_fn_invalid_schema';

            afterEach(function(done) {
                testHelper.executeQuery(
                    'DROP FUNCTION ' + fnName + '(text, text[], numeric, text, text)',
                    done
                );
            });

            var missingColumnScenarios = [
                {
                    columnsToMiss: ['cartodb_id']
                },
                {
                    columnsToMiss: ['the_geom']
                },
                {
                    columnsToMiss: ['cartodb_id', 'the_geom']
                }
            ];

            missingColumnScenarios.forEach(function(scenario, buster) {
                var missingColumns = scenario.columnsToMiss.join(' and ');
                it('should fail on missing ' + missingColumns, function (done) {
                    var tableColumns = mandatoryColumns();
                    scenario.columnsToMiss.forEach(function(columnToMiss) {
                        delete tableColumns[columnToMiss];
                    });
                    var expectedMessage = scenario.columnsToMiss.map(function(columnToMiss) {
                        return 'Missing required column `' + columnToMiss + '`';
                    }).join('; ');
                    testHelper.executeQuery(createInvalidDeprecatedFunctionQuery(fnName, tableColumns), function(err) {
                        assert.ifError(err);
                        var def = invalidSchemaDeprecatedSqlFnDefinition(fnName, buster);
                        testHelper.createAnalyses(def, function(err) {
                            assert.ok(err);
                            assert.equal(err.message, 'Validation failed: ' + expectedMessage + '.');
                            return done();
                        });
                    });
                });
            });
        });

        describe('invalid column types', function() {
            var fnName = 'DEP_EXT_test_deprecated_fn_invalid_type';

            afterEach(function(done) {
                testHelper.executeQuery(
                    'DROP FUNCTION ' + fnName + '(text, text[], numeric, text, text)',
                    done
                );
            });

            var invalidTypeScenarios = [
                {
                    column: 'cartodb_id',
                    expects: 'number',
                    tableColumns: {
                        'cartodb_id::text': 'cartodb_id text',
                        the_geom: 'the_geom geometry'
                    }
                },
                {
                    column: 'the_geom',
                    expects: 'geometry',
                    tableColumns: {
                        cartodb_id: 'cartodb_id numeric',
                        'ST_AsText(the_geom)': 'the_geom text'
                    }
                }
            ];
            invalidTypeScenarios.forEach(function(scenario, index) {
                it('should fail for ' + scenario.column + ' invalid column type', function (done) {
                    var createFnQuery = createInvalidDeprecatedFunctionQuery(fnName, scenario.tableColumns);
                    testHelper.executeQuery(createFnQuery, function(err) {
                        assert.ifError(err);
                        var def = invalidSchemaDeprecatedSqlFnDefinition(fnName, index);
                        testHelper.createAnalyses(def, function(err) {
                            assert.ok(err);
                            assert.equal(
                                err.message,
                                'Validation failed: Invalid type for column "' +
                                    scenario.column +
                                    '": expected `' + scenario.expects +
                                    '` got `string`.'
                            );
                            return done();
                        });
                    });
                });
            });
        });
    });

    describe('throw and catch errors', function() {

        var fnName = 'DEP_EXT_test_deprecated_fn_raising_error';

        before(function(done) {
            testHelper.executeQuery([
                'CREATE OR REPLACE FUNCTION ' + fnName + '(',
                '    query text, columns text[], buster numeric, table_name text, operation text',
                ')',
                'RETURNS VOID AS $$',
                '    BEGIN',
                '        IF buster < 0 THEN',
                '            RAISE EXCEPTION \'Invalid buster value=%\', buster',
                '                USING HINT = \'Please provide a positive value for buster\';',
                '        END IF;',
                '        IF operation = \'create\' THEN',
                '            EXECUTE \'CREATE TABLE \' || table_name || \' (',
                '                cartodb_id numeric, the_geom geometry, buster numeric',
                '            )\';',
                '        ELSIF operation = \'populate\' THEN',
                '            EXECUTE \'INSERT INTO \' || table_name || \' ',
                '                SELECT cartodb_id, the_geom, \' || buster || \'',
                '                FROM (\' || query || \') _q\';',
                '        END IF;',
                '    END;',
                '$$ LANGUAGE plpgsql;'
            ].join('\n'), done);
        });

        after(function(done) {
            testHelper.executeQuery(
                'DROP FUNCTION ' + fnName + '(text, text[], numeric, text, text)',
                done
            );
        });

        function invalidSchemaDeprecatedSqlFnDefinition(buster) {
            return {
                type: 'deprecated-sql-function',
                params: {
                    function_name: fnName,
                    primary_source: {
                        type: 'source',
                        params: {
                            query: QUERY_SOURCE
                        }
                    },
                    function_args: [buster]
                }
            };
        }

        it('should work for valid buster param', function (done) {
            testHelper.getResult(invalidSchemaDeprecatedSqlFnDefinition(1), function(err, rows) {
                assert.ok(!err, err);
                assert.equal(rows.length, 3);
                rows.forEach(function(row) {
                    assert.equal(row.buster, 1);
                });
                return done();
            });
        });

        it('should expose error raised from function', function (done) {
            testHelper.createAnalyses(invalidSchemaDeprecatedSqlFnDefinition(-1), function(err) {
                assert.ok(err);
                assert.equal(err.message, 'Invalid buster value=-1');
                assert.equal(err.hint, 'Please provide a positive value for buster');
                return done();
            });
        });
    });
});
