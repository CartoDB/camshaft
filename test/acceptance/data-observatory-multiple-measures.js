'use strict';

var assert = require('assert');
var testHelper = require('../helper');

describe('data-observatory-multiple-measures analysis', function () {
    function doMultipleMeasuresDefinition (params) {
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
    var geomIds = ['es.ine.the_geom', 'es.ine.the_geom'];
    var numeratorTimespans = ['2011', '2011'];
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

        testHelper.getResult(def, function (err) {
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

        testHelper.getResult(def, function (err) {
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

        testHelper.getResult(def, function (err) {
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

        testHelper.getResult(def, function (err, rows) {
            assert.ifError(err);
            rows.forEach(function (row) {
                columnNames.forEach(function (columnName) {
                    assert.ok(Object.prototype.hasOwnProperty.call(row, columnName), 'Missing ' + columnName + ' column');
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
            geom_ids: geomIds,
            numerator_timespans: numeratorTimespans,
            columnNames: columnNames
        });

        testHelper.getResult(def, function (err, rows) {
            assert.ifError(err);
            rows.forEach(function (row) {
                columnNames.forEach(function (columnName) {
                    assert.ok(Object.prototype.hasOwnProperty.call(row, columnName), 'Missing ' + columnName + ' column');
                });
            });
            return done();
        });
    });

    it('should create an analysis with all params allowing null elements for denominators', function (done) {
        var def = doMultipleMeasuresDefinition({
            numerators: numerators,
            denominators: [null, null],
            normalizations: normalizations,
            geom_ids: geomIds,
            numerator_timespans: numeratorTimespans,
            columnNames: columnNames
        });

        testHelper.getResult(def, function (err, rows) {
            assert.ifError(err);
            rows.forEach(function (row) {
                columnNames.forEach(function (columnName) {
                    assert.ok(Object.prototype.hasOwnProperty.call(row, columnName), 'Missing ' + columnName + ' column');
                });
            });
            return done();
        });
    });

    it('should cast columns based on OBS_GetMeta result', function (done) {
        const numerators = ['test.cast.text', 'es.ine.t1_1'];
        const normalizations = ['denominated', 'denominated'];
        const columnNames = ['text_col', 'numeric_col'];

        const def = doMultipleMeasuresDefinition({
            numerators: numerators,
            normalizations: normalizations,
            denominators: [null, null],
            geom_ids: [null, null],
            numerator_timespans: [null, null],
            columnNames: columnNames
        });

        testHelper.createAnalyses(def, (err, analysisResult) => {
            assert.ifError(err);
            testHelper.executeQuery(analysisResult.getRoot().getQuery(), (err, result) => {
                assert.ifError(err);

                const textColField = result.fields.find(field => field.name === 'text_col');
                const numericColField = result.fields.find(field => field.name === 'numeric_col');

                assert.equal(textColField.type, 'string');
                assert.equal(numericColField.type, 'number');

                return done();
            });
        });
    });
});
