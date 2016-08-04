'use strict';

var assert = require('assert');
var testHelper = require('../helper');


describe('lazy nodes', function() {

    var QUERY_ATM_MACHINES = 'select * from atm_machines';

    function filteredNodeDefinition(node, filters) {
        var clonedNode = JSON.parse(JSON.stringify(node));
        clonedNode.params.filters = filters;
        return clonedNode;
    }

    var sourceAnalysisDefinition = {
        type: 'source',
        params: {
            query: QUERY_ATM_MACHINES
        }
    };

    var bufferDefinition = {
        type: 'buffer',
        params: {
            source: sourceAnalysisDefinition,
            radius: 5000
        }
    };

    var acceptedBank = 'BBVA';
    var bankCategoryAcceptFilter = {
        bank_category: {
            type: 'category',
            column: 'bank',
            params: {
                accept: ['BBVA']
            }
        }
    };

    var rejectedBank = 'Santander';
    var bankCategoryRejectFilter = {
        bank_category: {
            type: 'category',
            column: 'bank',
            params: {
                reject: ['Santander']
            }
        }
    };

    function dataObservatoryMeasureDefinition(source) {
        return {
            type: 'data-observatory-measure',
            params: {
                source: source || bufferDefinition,
                final_column: 'population',
                segment_name: 'wadus_segment'
            }
        };
    }

    it('should be ready in basic scenario', function(done) {
        testHelper.createAnalyses(dataObservatoryMeasureDefinition(), function(err, doMeasureResult) {
            var rootNode = doMeasureResult.getRoot();
            assert.equal(rootNode.getStatus(), 'ready');
            return done();
        });
    });

    it('should be ready and pick filters from parent node', function(done) {
        var filteredBuffer = filteredNodeDefinition(bufferDefinition, bankCategoryRejectFilter);
        testHelper.createAnalyses(dataObservatoryMeasureDefinition(filteredBuffer), function(err, doMeasureResult) {
            var rootNode = doMeasureResult.getRoot();
            assert.equal(rootNode.getStatus(), 'ready');
            testHelper.getRows(rootNode.getQuery(), function(err, rows) {
                if (err) {
                    return done(err);
                }
                rows.forEach(function(row) {
                    assert.notEqual(row.bank, rejectedBank);
                });
                return done();
            });
        });
    });

    it('should be ready and pick filters from itself', function(done) {
        var filteredDataObservatory = filteredNodeDefinition(
            dataObservatoryMeasureDefinition(),
            bankCategoryAcceptFilter
        );
        testHelper.createAnalyses(filteredDataObservatory, function(err, doMeasureResult) {
            var rootNode = doMeasureResult.getRoot();
            assert.equal(rootNode.getStatus(), 'ready');
            testHelper.getRows(rootNode.getQuery(), function(err, rows) {
                if (err) {
                    return done(err);
                }
                rows.forEach(function(row) {
                    assert.equal(row.bank, acceptedBank);
                });
                return done();
            });
        });
    });

    it('should be ready and pick filters from parent node and itself', function(done) {
        var filteredBuffer = filteredNodeDefinition(bufferDefinition, bankCategoryRejectFilter);
        var filteredDataObservatoryWithFilteredBuffer = filteredNodeDefinition(
            dataObservatoryMeasureDefinition(filteredBuffer),
            bankCategoryAcceptFilter
        );
        testHelper.createAnalyses(filteredDataObservatoryWithFilteredBuffer, function(err, doMeasureResult) {
            var rootNode = doMeasureResult.getRoot();

            assert.equal(rootNode.getStatus(), 'ready');

            testHelper.getRows(rootNode.getQuery(), function(err, rows) {
                if (err) {
                    return done(err);
                }
                rows.forEach(function(row) {
                    assert.equal(row.bank, acceptedBank);
                });
                return done();
            });
        });
    });

    it('should use same cache table for filters in node and parent node', function(done) {
        var filteredBuffer = filteredNodeDefinition(bufferDefinition, bankCategoryRejectFilter);

        var dataObservatoryMeasure = dataObservatoryMeasureDefinition();
        var dataObservatoryWithFilteredBuffer = dataObservatoryMeasureDefinition(filteredBuffer);
        var filteredDataObservatory = filteredNodeDefinition(
            dataObservatoryMeasureDefinition(),
            bankCategoryAcceptFilter
        );
        var filteredDataObservatoryWithFilteredBuffer = filteredNodeDefinition(
            dataObservatoryMeasureDefinition(filteredBuffer),
            bankCategoryAcceptFilter
        );

        var analyses = [
            dataObservatoryMeasure,
            filteredDataObservatory,
            dataObservatoryWithFilteredBuffer,
            filteredDataObservatoryWithFilteredBuffer
        ];

        testHelper.createAnalyses(analyses, function(err, results) {
            if (err) {
                return done(err);
            }

            assert.equal(results.length, analyses.length);
            var rootNodes = results.map(function(result) { return result.getRoot(); });

            var dataObservatoryMeasureRoot = rootNodes[0];

            rootNodes.slice(1).forEach(function(rootNode) {
                assert.equal(dataObservatoryMeasureRoot.getTargetTable(), rootNode.getTargetTable());
            });
            rootNodes.forEach(function(rootNode) {
                assert.equal(rootNode.getStatus(), 'ready');
            });

            return done();
        });
    });

});
