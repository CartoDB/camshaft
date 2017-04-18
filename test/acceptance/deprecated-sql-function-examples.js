'use strict';

var assert = require('assert');
var fs = require('fs');

var testHelper = require('../helper');

describe('deprecated-sql-function examples', function () {

    function readSql(fileName, callback) {
        return fs.readFile(__dirname + '/sql/' + fileName, 'utf-8', callback);
    }

    describe('buffer', function() {
        before(function(done) {
            readSql('DEP_EXT_buffer.sql', function(err, content) {
                if (err) {
                    return done(err);
                }
                testHelper.executeQuery(content, done);
            });
        });

        after(function(done) {
            testHelper.executeQuery(
                'DROP FUNCTION DEP_EXT_buffer(text, text[], numeric, text, text)',
                done
            );
        });

        var QUERY_SOURCE = [
            'WITH sources AS (',
            '   select i as cartodb_id, st_setsrid(st_makepoint(0, i), 4326) as the_geom',
            '   from generate_series(1,3) as i',
            ')',
            'select *, st_x(the_geom) as x, st_y(the_geom) as y from sources'
        ].join('\n');

        function bufferDeprecatedSqlFnDefinition(radius) {
            return {
                type: 'deprecated-sql-function',
                params: {
                    function_name: 'DEP_EXT_buffer',
                    primary_source: {
                        type: 'source',
                        params: {
                            query: QUERY_SOURCE
                        }
                    },
                    function_args: [radius],
                }
            };
        }

        it('should create a polygon with the expected area', function (done) {
            var radius = 1000;
            testHelper.createAnalyses(bufferDeprecatedSqlFnDefinition(radius), function(err, result) {
                assert.ifError(err);
                var query = [
                    'SELECT',
                    '   cartodb_id, st_geometrytype(the_geom) AS gtype, st_area(the_geom::geography) AS area',
                    'FROM (' + result.getRoot().getQuery() + ') _q ORDER BY cartodb_id ASC'
                ].join('\n');
                var areaTolerance = 1e5;
                testHelper.getRows(query, function(err, rows) {
                    assert.ifError(err);
                    assert.equal(rows.length, 3);
                    rows.forEach(function(row, index) {
                        assert.equal(row.cartodb_id, index + 1);
                        assert.equal(row.gtype, 'ST_Polygon');
                        assert.ok(row.area > (Math.PI * Math.pow(radius, 2) - areaTolerance));
                        assert.ok(row.area < (Math.PI * Math.pow(radius, 2) + areaTolerance));
                    });
                    return done();
                });
            });
        });

    });

    describe('Spatial Interpolation', function() {
        before(function(done) {
            readSql('DEP_EXT_SpatialInterpolation.sql', function(err, content) {
                if (err) {
                    return done(err);
                }
                testHelper.executeQuery(content, done);
            });
        });

        after(function(done) {
            /*
            primary_source_query text, primary_source_columns text[],
            secondary_source_query text, secondary_source_columns text[],
            val_column text,
            method numeric, -- 0=nearest neighbor, 1=barymetric, 2=IDW
            number_of_neighbors numeric DEFAULT 0, -- 0=unlimited
            decay_order numeric DEFAULT 0,
            table_name text, operation text
            */
            testHelper.executeQuery(
                'DROP FUNCTION DEP_EXT_SpatialInterpolation(text, text[], text, text[], text, numeric, numeric, numeric, text, text)',
                done
            );
        });

        var QUERY_SOURCE = [
            'WITH sources AS (',
            '   select i as cartodb_id, st_setsrid(st_makepoint(0, i), 4326) as the_geom, i * 100 * random() as wadus',
            '   from generate_series(1,3) as i',
            ')',
            'select *, st_x(the_geom) as x, st_y(the_geom) as y from sources'
        ].join('\n');

        var QUERY_TARGET = [
            'WITH targets AS (',
            '   select i as cartodb_id, st_setsrid(st_makepoint(0, i), 4326) as the_geom',
            '   from generate_series(1,3) as i',
            ')',
            'select *, st_x(the_geom) as x, st_y(the_geom) as y from targets'
        ].join('\n');

        function spatialInterpolationDeprecatedSqlFnDefinition() {
            return {
                type: 'deprecated-sql-function',
                params: {
                    function_name: 'DEP_EXT_SpatialInterpolation',
                    primary_source: {
                        type: 'source',
                        params: {
                            query: QUERY_SOURCE
                        }
                    },
                    secondary_source: {
                        type: 'source',
                        params: {
                            query: QUERY_TARGET
                        }
                    },
                    function_args: ['wadus', 1, 5, 0],
                }
            };
        }

        it('should create a polygon with the expected area', function (done) {
            testHelper.getResult(spatialInterpolationDeprecatedSqlFnDefinition(), function(err, rows) {
                assert.ok(!err, err);
                assert.equal(rows.length, 3);
                rows.forEach(function(row) {
                    assert.ok(row.hasOwnProperty('wadus'));
                });
                return done();
            });
        });

    });

});
