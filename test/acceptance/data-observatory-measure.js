'use strict';

var assert = require('assert');
var testHelper = require('../helper');

describe('data-observatory-measure analysis', function() {
    var QUERY = 'select * from atm_machines limit 2';
    var FINAL_COLUMN = 'adults_first_level_studies';
    var SEGMENT_NAME = 'es.ine.t15_8';

    var sourceBarrios = {
        type: 'source',
        params: {
            query: QUERY
        }
    };

    describe('data observatory measure analysis', function () {
        var doMeasureDefinition = {
            type: 'data-observatory-measure',
            params: {
                source: sourceBarrios,
                final_column: FINAL_COLUMN,
                segment_name: SEGMENT_NAME,
                percent: false
            }
        };

        it('should create an analysis', function (done) {
            testHelper.createAnalyses(doMeasureDefinition, function(err, doMeasure) {
                assert.ifError(err);

                var rootNode = doMeasure.getRoot();

                testHelper.getRows(rootNode.getQuery(), function(err, rows) {
                    assert.ifError(err);
                    rows.forEach(function(row) {
                        assert.ok(typeof row.cartodb_id === 'number');
                        assert.ok(typeof row.the_geom === 'string');
                    });

                    return done();
                });
            });
        });
    });

    describe('data observatory measure denominator analysis', function () {
        var doMeasureDefinition = {
            type: 'data-observatory-measure',
            params: {
                source: sourceBarrios,
                final_column: FINAL_COLUMN,
                segment_name: SEGMENT_NAME,
                percent: false
            }
        };

        it('should create an analysis with denominator', function (done) {
            testHelper.createAnalyses(doMeasureDefinition, function(err, doMeasure) {
                assert.ifError(err);

                var rootNode = doMeasure.getRoot();

                testHelper.getRows(rootNode.getQuery(), function(err, rows) {
                    assert.ifError(err);
                    rows.forEach(function(row) {
                        assert.ok(typeof row.cartodb_id === 'number');
                        assert.ok(typeof row.the_geom === 'string');
                    });

                    return done();
                });
            });
        });
    });
});
