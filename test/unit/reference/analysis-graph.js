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

    function alreadyFilteredTradeAreaDefinition() {
        return {
            id: 'a1',
            type: 'trade-area',
            params: {
                source: sourceAtmDef,
                kind: TRADE_AREA_WALK,
                time: TRADE_AREA_15M,
                filters: {
                    original_bank_category: {
                        type: 'category',
                        column: 'bank',
                        params: {
                            accept: ['BBVA']
                        }
                    }
                }
            }
        };
    }

    var pointsInPolygonDefinition = {
        id: 'a2',
        type: 'point-in-polygon',
        params: {
            points_source: sourceRentListings,
            polygons_source: tradeAreaDefinition
        }
    };

    var noIdPointsInPolygonDefinition = {
        type: 'point-in-polygon',
        params: {
            points_source: sourceRentListings,
            polygons_source: tradeAreaDefinition
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

    it('should return a modified node with filters, keeping previous filters', function() {
        var analysisGraph = new reference.AnalysisGraph(alreadyFilteredTradeAreaDefinition());
        var filters = {
            bank_category: {
                type: 'category',
                column: 'bank',
                params: {
                    accept: ['BBVA']
                }
            }
        };
        var analysisDefinition = analysisGraph.getDefinitionWith('a1', {filters: filters});

        var extendedGraph = new reference.AnalysisGraph(analysisDefinition);
        var extendedNodes = extendedGraph.getNodesWithId();

        assert.deepEqual(
            extendedNodes.a1.params.filters.original_bank_category,
            alreadyFilteredTradeAreaDefinition().params.filters.original_bank_category
        );

        assert.deepEqual(
            extendedNodes.a1.params.filters.bank_category,
            filters.bank_category
        );
    });

    it('should return a modified node with filters, overwriting keys', function() {
        var analysisGraph = new reference.AnalysisGraph(alreadyFilteredTradeAreaDefinition());
        var filters = {
            original_bank_category: {
                type: 'category',
                column: 'bank',
                params: {
                    accept: ['BBVA']
                }
            }
        };
        var analysisDefinition = analysisGraph.getDefinitionWith('a1', {filters: filters});

        var extendedGraph = new reference.AnalysisGraph(analysisDefinition);
        var extendedNodes = extendedGraph.getNodesWithId();

        assert.deepEqual(extendedNodes.a1.params.filters, filters);
    });

    it('should work with missing optional nodes', function() {
        var def = {
            id: 'a1',
            type: 'deprecated-sql-function',
            params: {
                function_name: 'DEP_EXT_wadus',
                primary_source: {
                    id: 'a0',
                    type: 'source',
                    params: {
                        query: 'SELECT * FROM table_name'
                    }
                },
                function_args: [
                    'x',
                    'y'
                ]
            }
        };

        var filters = {
            a1: {
                range_filter: {
                    type: 'range',
                    column: 'y',
                    params:{
                        min: 2,
                        max: 8
                    }
                }
            }
        };

        var analysisGraph = new reference.AnalysisGraph(def);

        var extendedDef = analysisGraph.getDefinitionWith('a1', { filters: filters });
        var extendedGraph = new reference.AnalysisGraph(extendedDef);
        var extendedNodes = extendedGraph.getNodesWithId();
        assert.deepEqual(extendedNodes.a1.params.filters, filters);
    });

});
