'use strict';

var assert = require('assert');
var testHelper = require('../helper');


describe('closest', function () {

    var QUERY_SOURCE = 'select * from airbnb_rooms';
    var QUERY_TARGET = 'select * from atm_machines';

    var analysisDefinition = {
        type: 'closest',
        params: {
            source: {
                type: 'source',
                params: {
                    query: QUERY_SOURCE
                }
            },
            target: {
                type: 'source',
                params: {
                    query: QUERY_TARGET
                }
            },
            responses: 2,
            category: 'bank'
        }
    };

    it('basic CLOSEST test', function (done) {
        testHelper.createAnalyses(analysisDefinition, function (err, closest) {

            assert.ifError(err);

            var rootNode = closest.getRoot();

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

    it('check CLOSEST number of responses', function (done) {
        testHelper.createAnalyses(analysisDefinition, function (err, closest) {

            assert.ifError(err);

            var rootNode = closest.getRoot();

            testHelper.getRows(rootNode.getQuery(), function (err, rows) {
                var checker = {};
                var checked;
                assert.ifError(err);
                rows.forEach(function (row) {
                    checker[row.bank] = (!checker[row.bank])?  1 : checker[row.bank] + 1;
                });
                checked = Object.keys(checker).filter(function(key) {
                    /*
                    in the corner case that the number of responses requested is
                    bigger than the available items within a category, the number of
                    responses will below the requested value
                    */
                    return checker[key] > analysisDefinition.params.responses;
                });
                assert.ok(checked.length == 0);
                return done();
            });
        });
    });


});
