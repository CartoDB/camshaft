'use strict';

var assert = require('assert');

var QueryRunner = require('../../lib/postgresql/query-runner');
var BatchClient = require('../../lib/postgresql/batch-client');
var Analysis = require('../../lib/analysis');

var testConfig = require('../test-config');

describe('performance', function() {

    function explain(query, callback) {
        var queryRunner = new QueryRunner(testConfig.db);
        queryRunner.run('EXPLAIN (FORMAT JSON) ' + query, function(err, result) {
            assert.ok(!err, err);
            assert.ok(result);
            var rows = result.rows || [{}];
            var queryPlan = rows[0]['QUERY PLAN'][0].Plan;
            return callback(null, queryPlan);
        });
    }

    var enqueueFn;
    var enqueueCalled;

    before(function() {
        enqueueFn = BatchClient.prototype.enqueue;
        enqueueCalled = 0;
        BatchClient.prototype.enqueue = function(query, callback) {
            enqueueCalled += 1;
            return callback(null, { status: 'ok' });
        };
    });

    after(function () {
        assert.ok(enqueueCalled > 0);
        BatchClient.prototype.enqueue = enqueueFn;
    });

    var SOURCE_AIRBNB = 'select * from airbnb_rooms';
    var SOURCE_DISTRICTS = 'select * from madrid_districts';

    var analyses = [
        {
            'type': 'point-in-polygon',
            'params': {
                'points_source': {
                    'type': 'source',
                    'params': {
                        'query': SOURCE_AIRBNB
                    }
                },
                'polygons_source': {
                    'type': 'source',
                    'params': {
                        'query': SOURCE_DISTRICTS
                    }
                }
            }
        },
        {
            'type': 'intersection',
            'params': {
                'source': {
                    'type': 'source',
                    'params': {
                        'query': SOURCE_AIRBNB
                    }
                },
                'target': {
                    'type': 'source',
                    'params': {
                        'query': SOURCE_DISTRICTS
                    }
                }
            }
        }
    ];

    analyses.forEach(function(analysisDef) {
        it('should avoid CTE Scan in "' + analysisDef.type + '" analysis', function (done) {
            Analysis.create(testConfig, analysisDef, function (err, analysis) {
                if (err) {
                    return done(err);
                }

                explain(analysis.getQuery(), function(err, queryPlan) {
                    assert.ok(!err, err);

                    getNodeTypes(queryPlan).forEach(function(nodeType) {
                        assert.notEqual(nodeType, 'CTE Scan', 'Found CTE Scan in query explain');
                    });

                    done();
                });
            });
        });
    });

    function getNodeTypes(queryPlan, nodeTypes) {
        nodeTypes = nodeTypes || [];
        nodeTypes.push(queryPlan['Node Type']);
        if (Array.isArray(queryPlan.Plans)) {
            queryPlan.Plans.forEach(function(plan) {
                getNodeTypes(plan, nodeTypes);
            });
        }
        return nodeTypes;
    }

});
