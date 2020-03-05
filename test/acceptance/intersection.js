'use strict';

var assert = require('assert');
var testHelper = require('../helper');

describe('intersection analysis', function () {
    var SOURCE_AIRBNB = 'select * from airbnb_rooms';
    var SOURCE_DISTRICTS = 'select * from madrid_districts';

    var sourceAirbnbRooms = {
        type: 'source',
        params: {
            query: SOURCE_DISTRICTS
        }
    };

    var sourceMadridDistrict = {
        type: 'source',
        params: {
            query: SOURCE_AIRBNB
        }
    };

    describe('intersection with all source columns', function () {
        var intersectionAnalysisDefinition = {
            type: 'intersection',
            params: {
                source: sourceAirbnbRooms,
                target: sourceMadridDistrict
            }
        };

        it('should create an analysis', function (done) {
            testHelper.createAnalyses(intersectionAnalysisDefinition, function (err, intersectionAnalysis) {
                assert.ifError(err);

                var rootNode = intersectionAnalysis.getRoot();

                testHelper.getRows(rootNode.getQuery(), function (err, rows) {
                    assert.ifError(err);
                    rows.forEach(function (row) {
                        assert.ok(typeof row.source_cartodb_id === 'number');
                        assert.ok(typeof row.the_geom === 'string');
                        assert.ok(typeof row.source_name === 'string');
                    });

                    return done();
                });
            });
        });
    });

    describe('intersection with only name source column', function () {
        var intersectionAnalysisDefinition = {
            type: 'intersection',
            params: {
                source: sourceAirbnbRooms,
                source_columns: ['name'],
                target: sourceMadridDistrict
            }
        };

        it('should create an analysis', function (done) {
            testHelper.createAnalyses(intersectionAnalysisDefinition, function (err, intersectionAnalysis) {
                assert.ifError(err);

                var rootNode = intersectionAnalysis.getRoot();

                testHelper.getRows(rootNode.getQuery(), function (err, rows) {
                    assert.ifError(err);
                    rows.forEach(function (row) {
                        assert.ok(typeof row.cartodb_id === 'number');
                        assert.ok(typeof row.the_geom === 'string');
                        assert.ok(typeof row.source_name === 'string');
                    });

                    return done();
                });
            });
        });
    });
});
