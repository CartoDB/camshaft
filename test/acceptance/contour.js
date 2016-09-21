'use strict';

var assert = require('assert');
var testHelper = require('../helper');


describe('contour', function () {

    var QUERY_AIRBNB_ROOMS = 'select * from airbnb_rooms';

    var analysisDefinition = {
        type: 'contour',
        params: {
            source: {
                type: 'source',
                params: {
                    query: QUERY_AIRBNB_ROOMS
                }
            },
            column: 'price',
            buffer: 0.2,
            method: 'barymetric',
            class_method: 'quantiles',
            steps: 7,
            resolution: 250
        }
    };

    it('basic contour test', function (done) {
        testHelper.createAnalyses(analysisDefinition, function (err, contour) {

            assert.ifError(err);

            var rootNode = contour.getRoot();

            testHelper.getRows(rootNode.getQuery(), function (err, rows) {
                assert.ifError(err);
                rows.forEach(function (row) {
                    assert.ok(typeof row.cartodb_id === 'number');
                    assert.ok(typeof row.the_geom === 'string');
                });
                return done();
            });
        });
    });

});
