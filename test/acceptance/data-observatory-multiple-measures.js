'use strict';

var assert = require('assert');
var testHelper = require('../helper');

describe.only('data-observatory-multiple-measures analysis', function() {
    function doMultipleMeasuresDefinition(numerators, columnNames) {
        return {
            type: 'data-observatory-multiple-measures',
            params: {
                source: {
                    type: 'source',
                    params: {
                        query: 'select * from atm_machines limit 2'
                    }
                },
                numerators: numerators,
                column_names: columnNames
            }
        };
    }

    var numerators = ['es.ine.t2_2', 'es.ine.t2_1'];
    var columnNames = ['females', 'males'];

    it('should fail on different number of numerators and column names', function (done) {
        var def = doMultipleMeasuresDefinition(numerators, []);
        testHelper.getResult(def, function(err) {
            assert.ok(err);
            assert.equal(err.message, 'The number of numerators=2 does not match the number of column_names=0');
            return done();
        });
    });

    it('should fail on empty numerators', function (done) {
        var def = doMultipleMeasuresDefinition([], []);
        testHelper.getResult(def, function(err) {
            assert.ok(err);
            assert.equal(err.message, 'The numerators array cannot be empty');
            return done();
        });
    });

    it('should create an analysis', function (done) {
        var def = doMultipleMeasuresDefinition(numerators, columnNames);
        testHelper.getResult(def, function(err, rows) {
            assert.ifError(err);
            console.log(rows);
            rows.forEach(function(row) {
                columnNames.forEach(function(columnName) {
                    assert.ok(row.hasOwnProperty(columnName), 'Missing ' + columnName + ' column');
                });
            });
            return done();
        });
    });

});
