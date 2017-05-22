'use strict';

var assert = require('assert');
var testHelper = require('../helper');

describe('data-observatory-multiple-measures analysis', function() {
    function doMultipleMeasuresDefinition(params) {
        return {
            type: 'data-observatory-multiple-measures',
            params: {
                source: {
                    type: 'source',
                    params: {
                        query: 'select * from atm_machines limit 2'
                    }
                },
                numerators: params.numerators,
                normalizations: params.normalizations,
                denominators: params.denominators,
                geom_ids: params.geom_ids,
                numerator_timespans: params.numerator_timespans,
                column_names: params.columnNames
            }
        };
    }

    var numerators = ['es.ine.t2_2', 'es.ine.t2_1'];
    var normalizations = ['denominated', 'denominated'];
    var denominators = ['es.ine.t1_1', 'es.ine.t1_1'];
    var geom_ids = ['es.ine.the_geom', 'es.ine.the_geom'];
    var numerator_timespans = ['2011', '2011'];
    var columnNames = ['females', 'males'];

    it('should fail on different number of numerators and column names', function (done) {
        var def = doMultipleMeasuresDefinition({
            numerators: numerators,
            normalizations: normalizations,
            denominators: [null, null],
            geom_ids: [null, null],
            numerator_timespans: [null, null],
            columnNames: []
        });

        testHelper.getResult(def, function(err) {
            assert.ok(err);
            assert.equal(err.message, 'The number of numerators=2 does not match the number of column_names=0');
            return done();
        });
    });

    it('should fail on empty normalizations', function (done) {
        var def = doMultipleMeasuresDefinition({
            numerators: numerators,
            normalizations: [],
            denominators: [null, null],
            geom_ids: [null, null],
            numerator_timespans: [null, null],
            columnNames: columnNames
        });

        testHelper.getResult(def, function(err) {
            assert.ok(err);
            assert.equal(err.message, 'The normalizations array cannot be empty');
            return done();
        });
    });

    it('should fail on empty numerators', function (done) {
        var def = doMultipleMeasuresDefinition({
            numerators: [],
            normalizations: normalizations,
            denominators: [null, null],
            geom_ids: [null, null],
            numerator_timespans: [null, null],
            columnNames: columnNames
        });

        testHelper.getResult(def, function(err) {
            assert.ok(err);
            assert.equal(err.message, 'The numerators array cannot be empty');
            return done();
        });
    });

    it('should create an analysis with just mandatory params', function (done) {
        var def = doMultipleMeasuresDefinition({
            numerators: numerators,
            normalizations: normalizations,
            denominators: [null, null],
            geom_ids: [null, null],
            numerator_timespans: [null, null],
            columnNames: columnNames
        });

        testHelper.getResult(def, function(err, rows) {
            assert.ifError(err);
            rows.forEach(function(row) {
                columnNames.forEach(function(columnName) {
                    assert.ok(row.hasOwnProperty(columnName), 'Missing ' + columnName + ' column');
                });
            });
            return done();
        });
    });

    it('should create an analysis with all params', function (done) {
        var def = doMultipleMeasuresDefinition({
            numerators: numerators,
            denominators: denominators,
            normalizations: normalizations,
            geom_ids: geom_ids,
            numerator_timespans: numerator_timespans,
            columnNames: columnNames
        });

        testHelper.getResult(def, function(err, rows) {
            assert.ifError(err);
            rows.forEach(function(row) {
                columnNames.forEach(function(columnName) {
                    assert.ok(row.hasOwnProperty(columnName), 'Missing ' + columnName + ' column');
                });
            });
            return done();
        });
    });

    it('should create an analysis with all params allowing null elements for denominators', function (done) {
        var def = doMultipleMeasuresDefinition({
            numerators: numerators,
            denominators: [ null, null ],
            normalizations: normalizations,
            geom_ids: geom_ids,
            numerator_timespans: numerator_timespans,
            columnNames: columnNames
        });

        testHelper.getResult(def, function(err, rows) {
            assert.ifError(err);
            rows.forEach(function(row) {
                columnNames.forEach(function(columnName) {
                    assert.ok(row.hasOwnProperty(columnName), 'Missing ' + columnName + ' column');
                });
            });
            return done();
        });
    });
});
