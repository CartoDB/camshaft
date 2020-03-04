'use strict';

var assert = require('assert');
var testHelper = require('../helper');

describe('line-to-column analysis', function () {
    var QUERY_SOURCE = 'select * from atm_machines';

    var sourceAtmMachines = {
        type: 'source',
        params: {
            query: QUERY_SOURCE
        }
    };

    describe('line to column analysis', function () {
        var lineToColumnDefinition = {
            type: 'line-to-column',
            params: {
                source: sourceAtmMachines,
                target_column: 'the_geom_target'
            }
        };

        it('should create analysis', function (done) {
            testHelper.createAnalyses(lineToColumnDefinition, function (err, lineToColumn) {
                assert.ifError(err);

                var rootNode = lineToColumn.getRoot();

                testHelper.getRows(rootNode.getQuery(), function (err, rows) {
                    assert.ifError(err);
                    rows.forEach(function (row) {
                        assert.ok(typeof row.cartodb_id === 'number');
                        assert.ok(typeof row.the_geom === 'string');
                        assert.ok(typeof row.length === 'number');
                    });

                    return done();
                });
            });
        });
    });
});
