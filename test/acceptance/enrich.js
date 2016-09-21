// reescribir, que esto es una copia de cdb_contour sin editar

'use strict';

var assert = require('assert');
var testHelper = require('../helper');


describe('enrich', function () {

    var source = {
        type: 'source',
        params: {
            query: 'select * from airbnb_rooms'
        }
    };
    var target = {
        type: 'source',
        params: {
            query: 'select * from madrid_districts'
        }
    };

    var analysisDefinition = {
        type: 'enrich',
        params: {
            source: source,
            target: target,
            column: 'price',
            method: 'IDW',
            number_of_neighbors: 0,
            decay_order: 0
        }
    };

    it('enrich by layer test', function (done) {
        testHelper.createAnalyses(analysisDefinition, function (err, enrich) {

            assert.ifError(err);

            var rootNode = enrich.getRoot();

            testHelper.getRows(rootNode.getQuery(), function (err, rows) {
                assert.ifError(err);
                rows.forEach(function (row) {
                    assert.ok(typeof row.cartodb_id === 'number');
                    assert.ok(typeof row.the_geom === 'string');
                    assert.ok(typeof row.price === 'number');
                });
                return done();
            });
        });
    });

});
