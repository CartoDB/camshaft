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
            buffer: '0.2',
            method: 'barymetric',
            class_method: 'quantiles',
            steps: 7,
            resolution: 250
        }
    };

    testHelper.createAnalyses(analysisDefinition, function (err, analysisResult) {
        if (err) {
            return done(err);
        }
        testHelper.getRows(analysisResult.getQuery(), function (err, rows) {
            if (err) {
                return done(err);
            }
            rows.forEach(function (row) {
                assert.ok(row.max_value > row.min_value);
            });
            return done();
        });
    });

});
