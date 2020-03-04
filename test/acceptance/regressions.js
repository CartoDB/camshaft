'use strict';

var assert = require('assert');

var Analysis = require('../../lib/analysis');

var TestConfig = require('../test-config');

describe('regressions', function () {
    function duplicatedSourceStatusNotUpdated (nodeName) {
        return {
            id: nodeName,
            type: 'source',
            params: {
                query: 'SELECT * FROM airbnb_rooms'
            }
        };
    }

    var sourcePending = {
        id: 'a2',
        type: 'point-in-polygon',
        params: {
            points_source: duplicatedSourceStatusNotUpdated('airbnb_rooms'),
            polygons_source: {
                id: 'a1',
                type: 'trade-area',
                params: {
                    source: duplicatedSourceStatusNotUpdated('a0'),
                    kind: 'car',
                    time: 100,
                    isolines: 1,
                    dissolved: false
                }
            }
        }
    };

    before(function (done) {
        this.testConfig = TestConfig.create({ batch: { inlineExecution: true } });
        Analysis.create(this.testConfig, sourcePending, done);
    });

    it('should get ready status after first creation', function (done) {
        Analysis.create(this.testConfig, sourcePending, function (err, analysis) {
            if (err) {
                return done(err);
            }

            function checkNodeIsReady (node) {
                var status = node.getStatus();
                assert.equal(status, 'ready', 'Unexpected node status for ' + node.type);
            }

            var sortedNodes = analysis.getSortedNodes();
            sortedNodes.forEach(checkNodeIsReady);

            var nodesList = analysis.getNodes();
            nodesList.forEach(checkNodeIsReady);

            done();
        });
    });

    it('should fail properly when a node param is missing', function (done) {
        var samplingSource = {
            id: 'a1',
            type: 'sampling',
            params: {
                missing_source: {
                    id: 'a0',
                    type: 'source',
                    params: {
                        query: 'SELECT * FROM airbnb_rooms'
                    }
                }
            }
        };
        Analysis.create(this.testConfig, samplingSource, function (err) {
            assert.ok(err);
            assert.equal(err.message, 'Invalid type for param "source", expects "node" type, got `undefined`');
            return done();
        });
    });
});
