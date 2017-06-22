'use strict';

var assert = require('assert');
var testHelper = require('../helper');


describe('closest analysis', function () {

    var QUERY_SOURCE = 'select * from closest_analysis_source';
    /**
     * cartodb_id,x,y
     * 1,1,0
     * 2,2,0
     * 3,3,0
     */

    var QUERY_TARGET = 'select * from closest_analysis_target';
    /**
     * cartodb_id,category,x,y
     * 1,A,1,0.1
     * 2,B,1,0.2
     * 3,C,1,0.3
     * 4,A,2,0.1
     * 5,B,2,0.2
     * 6,C,2,0.3
     * 7,A,3,0.1
     * 8,B,3,0.2
     * 9,C,3,0.3
     */


    /**
     *   C                   C                  C  \
     *   B                   B                  B  | <= TARGETS
     *   A                   A                  A  /
     *   *                   *                  *    <= SOURCES
     * (1,0)               (2,0)              (3,0)
     */

    function closestAnalysisDefinition(responses, category) {
        return {
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
                responses: responses || 1,
                category: category
            }
        };
    }

    it('basic (1 target per source)', function (done) {
        testHelper.getResult(closestAnalysisDefinition(), function(err, rows) {
            assert.ifError(err);
            assert.equal(rows.length, 3);
            testHelper.checkCartodbIdIsSorted(rows);
            testHelper.checkCartodbIdIsUnique(rows);

            assert.equal(rows[0].source_cartodb_id, 1);
            assert.equal(rows[0].x, 1);
            assert.equal(rows[0].y, 0.1);
            assert.equal(rows[0].category, 'A');

            assert.equal(rows[1].source_cartodb_id, 2);
            assert.equal(rows[1].x, 2);
            assert.equal(rows[1].y, 0.1);
            assert.equal(rows[1].category, 'A');

            assert.equal(rows[2].source_cartodb_id, 3);
            assert.equal(rows[2].x, 3);
            assert.equal(rows[2].y, 0.1);
            assert.equal(rows[2].category, 'A');

            return done();
        });
    });

    it('2 targets per source', function (done) {
        testHelper.getResult(closestAnalysisDefinition(2), function(err, rows) {
            assert.ifError(err);
            assert.equal(rows.length, 6);
            testHelper.checkCartodbIdIsSorted(rows);
            testHelper.checkCartodbIdIsUnique(rows);

            assert.equal(rows[0].source_cartodb_id, 1);
            assert.equal(rows[0].x, 1);
            assert.equal(rows[0].y, 0.1);
            assert.equal(rows[0].category, 'A');
            assert.equal(rows[1].source_cartodb_id, 1);
            assert.equal(rows[1].x, 1);
            assert.equal(rows[1].y, 0.2);
            assert.equal(rows[1].category, 'B');

            assert.equal(rows[2].source_cartodb_id, 2);
            assert.equal(rows[2].x, 2);
            assert.equal(rows[2].y, 0.1);
            assert.equal(rows[2].category, 'A');
            assert.equal(rows[3].source_cartodb_id, 2);
            assert.equal(rows[3].x, 2);
            assert.equal(rows[3].y, 0.2);
            assert.equal(rows[3].category, 'B');

            assert.equal(rows[4].source_cartodb_id, 3);
            assert.equal(rows[4].x, 3);
            assert.equal(rows[4].y, 0.1);
            assert.equal(rows[4].category, 'A');
            assert.equal(rows[5].source_cartodb_id, 3);
            assert.equal(rows[5].x, 3);
            assert.equal(rows[5].y, 0.2);
            assert.equal(rows[5].category, 'B');

            return done();
        });
    });

    it('4 targets per source, only checks for source=1', function (done) {
        testHelper.getResult(closestAnalysisDefinition(4), function(err, rows) {
            assert.ifError(err);
            assert.equal(rows.length, 12);
            testHelper.checkCartodbIdIsUnique(rows);

            assert.equal(rows[0].source_cartodb_id, 1);
            assert.equal(rows[0].x, 1);
            assert.equal(rows[0].y, 0.1);
            assert.equal(rows[0].category, 'A');
            assert.equal(rows[1].source_cartodb_id, 1);
            assert.equal(rows[1].x, 1);
            assert.equal(rows[1].y, 0.2);
            assert.equal(rows[1].category, 'B');
            assert.equal(rows[2].source_cartodb_id, 1);
            assert.equal(rows[2].x, 1);
            assert.equal(rows[2].y, 0.3);
            assert.equal(rows[2].category, 'C');

            assert.equal(rows[3].source_cartodb_id, 1);
            assert.equal(rows[3].x, 2);
            assert.equal(rows[3].y, 0.1);
            assert.equal(rows[3].category, 'A');

            return done();
        });
    });

    it('does not return more points than existing ones for big responses param', function (done) {
        testHelper.getResult(closestAnalysisDefinition(10), function(err, rows) {
            assert.ifError(err);
            // max 9 targets per source
            assert.equal(rows.length, 27);
            testHelper.checkCartodbIdIsUnique(rows);
            return done();
        });
    });

    describe('category', function() {
        it('basic category (1 target per source and category)', function (done) {
            testHelper.getResult(closestAnalysisDefinition(1, 'category'), function(err, rows) {
                assert.ifError(err);
                assert.equal(rows.length, 9);
                testHelper.checkCartodbIdIsSorted(rows);
                testHelper.checkCartodbIdIsUnique(rows);

                assert.equal(rows[0].source_cartodb_id, 1);
                assert.equal(rows[0].x, 1);
                assert.equal(rows[0].y, 0.1);
                assert.equal(rows[0].category, 'A');

                assert.equal(rows[1].source_cartodb_id, 1);
                assert.equal(rows[1].x, 1);
                assert.equal(rows[1].y, 0.2);
                assert.equal(rows[1].category, 'B');

                assert.equal(rows[2].source_cartodb_id, 1);
                assert.equal(rows[2].x, 1);
                assert.equal(rows[2].y, 0.3);
                assert.equal(rows[2].category, 'C');

                return done();
            });
        });

        it('2 results per category per source', function (done) {
            testHelper.getResult(closestAnalysisDefinition(2, 'category'), function(err, rows) {
                assert.ifError(err);
                assert.equal(rows.length, 18);
                testHelper.checkCartodbIdIsUnique(rows);

                assert.equal(rows[0].source_cartodb_id, 1);
                assert.equal(rows[0].x, 1);
                assert.equal(rows[0].y, 0.1);
                assert.equal(rows[0].category, 'A');
                assert.equal(rows[1].source_cartodb_id, 1);
                assert.equal(rows[1].x, 2);
                assert.equal(rows[1].y, 0.1);
                assert.equal(rows[1].category, 'A');

                assert.equal(rows[2].source_cartodb_id, 1);
                assert.equal(rows[2].x, 1);
                assert.equal(rows[2].y, 0.2);
                assert.equal(rows[2].category, 'B');
                assert.equal(rows[3].source_cartodb_id, 1);
                assert.equal(rows[3].x, 2);
                assert.equal(rows[3].y, 0.2);
                assert.equal(rows[3].category, 'B');

                assert.equal(rows[4].source_cartodb_id, 1);
                assert.equal(rows[4].x, 1);
                assert.equal(rows[4].y, 0.3);
                assert.equal(rows[4].category, 'C');
                assert.equal(rows[5].source_cartodb_id, 1);
                assert.equal(rows[5].x, 2);
                assert.equal(rows[5].y, 0.3);
                assert.equal(rows[5].category, 'C');

                assert.equal(rows[6].source_cartodb_id, 2);
                assert.equal(rows[6].x, 2);
                assert.equal(rows[6].y, 0.1);
                assert.equal(rows[6].category, 'A');

                return done();
            });
        });

        it('does not return more results per category than existing ones', function (done) {
            testHelper.getResult(closestAnalysisDefinition(4, 'category'), function(err, rows) {
                assert.ifError(err);
                assert.equal(rows.length, 27);
                testHelper.checkCartodbIdIsUnique(rows);

                assert.equal(rows[0].source_cartodb_id, 1);
                assert.equal(rows[0].x, 1);
                assert.equal(rows[0].y, 0.1);
                assert.equal(rows[0].category, 'A');
                assert.equal(rows[1].source_cartodb_id, 1);
                assert.equal(rows[1].x, 2);
                assert.equal(rows[1].y, 0.1);
                assert.equal(rows[1].category, 'A');
                assert.equal(rows[2].source_cartodb_id, 1);
                assert.equal(rows[2].x, 3);
                assert.equal(rows[2].y, 0.1);
                assert.equal(rows[2].category, 'A');

                assert.equal(rows[3].source_cartodb_id, 1);
                assert.equal(rows[3].x, 1);
                assert.equal(rows[3].y, 0.2);
                assert.equal(rows[3].category, 'B');

                assert.equal(rows[9].source_cartodb_id, 2);
                assert.equal(rows[9].x, 2);
                assert.equal(rows[9].y, 0.1);
                assert.equal(rows[9].category, 'A');

                return done();
            });
        });
    });
});
