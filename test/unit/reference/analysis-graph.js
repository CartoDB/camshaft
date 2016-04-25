'use strict';

var assert = require('assert');

var reference = require('../../../reference/index');

describe('camshaft-reference-graph', function() {

    var QUERY_ATM_MACHINES = 'select * from atm_machines';
    var TRADE_AREA_WALK = 'walk';
    var TRADE_AREA_15M = 1200;

    var sourceAtmDef = {
        id: 'a0',
        type: 'source',
        params: {
            query: QUERY_ATM_MACHINES
        }
    };

    var sourceRentListings = {
        id: 'b0',
        type: 'source',
        params: {
            query: 'select the_geom, listing_url, price from airbnb_madrid_oct_2015_listings'
        }
    };

    var tradeAreaDefinition = {
        id: 'a1',
        type: 'trade-area',
        params: {
            source: sourceAtmDef,
            kind: TRADE_AREA_WALK,
            time: TRADE_AREA_15M
        }
    };

    var pointsInPolygonDefinition = {
        id: 'a2',
        type: 'intersection',
        params: {
            source_a: sourceRentListings,
            source_b: tradeAreaDefinition
        }
    };

    var noIdPointsInPolygonDefinition = {
        type: 'intersection',
        params: {
            source_a: sourceRentListings,
            source_b: tradeAreaDefinition
        }
    };

    it('should return a dictionary with all nodes with ids', function() {
        var analysisGraph = new reference.AnalysisGraph(pointsInPolygonDefinition);

        var nodes = analysisGraph.getNodesWithId();

        var nodeIds = Object.keys(nodes);
        assert.deepEqual(nodeIds, ['a2', 'b0', 'a1', 'a0']);
    });

    it('should return a list with all nodes', function() {
        var analysisGraph = new reference.AnalysisGraph(pointsInPolygonDefinition);

        var nodesList = analysisGraph.getNodesList();

        assert.equal(nodesList.length, 4);
    });

    it('should return a list with all nodes but skip node without id', function() {
        var analysisGraph = new reference.AnalysisGraph(noIdPointsInPolygonDefinition);

        var nodesList = analysisGraph.getNodesList();
        assert.equal(nodesList.length, 4);

        var nodes = analysisGraph.getNodesWithId();
        var nodeIds = Object.keys(nodes);
        assert.deepEqual(nodeIds, ['b0', 'a1', 'a0']);
    });

    it('should return a modified node with filters', function() {
        var analysisGraph = new reference.AnalysisGraph(tradeAreaDefinition);
        var filters = {
            bank_category: {
                type: 'category',
                column: 'bank',
                params: {
                    accept: ['BBVA']
                }
            }
        };
        var analysisDefinition = analysisGraph.getDefinitionWith('a0', {filters: filters});

        var extendedGraph = new reference.AnalysisGraph(analysisDefinition);
        var nodes = extendedGraph.getNodesWithId();

        assert.deepEqual(nodes.a0.params.filters, filters);
    });

});
