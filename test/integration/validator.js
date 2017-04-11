'use strict';

var assert = require('assert');

var validator = require('../../lib/dag/validator');
var Factory = require('../../lib/workflow/factory');


describe('workflow-validator', function() {

    var QUERY_ATM_MACHINES = 'select * from atm_machines';
    var TRADE_AREA_WALK = 'walk';
    var TRADE_AREA_15M = 900;
    var ISOLINES = 6;
    var DISSOLVED = false;

    var tradeAreaAnalysisDefinition = {
        type: 'trade-area',
        params: {
            source: {
                type: 'source',
                params: {
                    query: QUERY_ATM_MACHINES
                }
            },
            kind: TRADE_AREA_WALK,
            time: TRADE_AREA_15M,
            isolines: ISOLINES,
            dissolved: DISSOLVED
        }
    };

    var missedParamTradeAreaAnalysisDefinition = {
        type: 'trade-area',
        id: 'HEAD',
        params: {
            source: {
                type: 'source',
                params: {
                    query: QUERY_ATM_MACHINES
                }
            },
            time: TRADE_AREA_15M,
            isolines: ISOLINES,
            dissolved: DISSOLVED
        }
    };


    function createServiceStub(result) {
        return function(query, callback) {
            return callback(null, result);
        };
    }

    var DatabaseServiceStub = {
        run: createServiceStub({}),
        getSchema: createServiceStub([]),
        getColumnNames: createServiceStub([]),
        getColumns: createServiceStub([]),
        getMetadataFromAffectedTables: function(query, skip, callback) {
            return callback(null, {'last_update': new Date(), 'affected_tables': []});
        },
        createCacheTable: function(node, callback) {
            return callback(null, true);
        },
        registerNodesInCatalog: createServiceStub([]),
        trackNode: createServiceStub([]),
        enqueue: createServiceStub({})
    };

    it('should validate graph', function(done) {
        var factory = new Factory('foo-user', DatabaseServiceStub);
        factory.create(tradeAreaAnalysisDefinition, function(err, node) {
            assert.ok(!err, err);

            assert.ok(validator.isValid(node));

            done();
        });
    });

    it('should have user from factory as owner', function(done) {
        var factory = new Factory('foo-user', DatabaseServiceStub);
        factory.create(tradeAreaAnalysisDefinition, function(err, node) {
            assert.ok(!err, err);

            assert.equal(node.getOwner(), 'foo-user');

            done();
        });
    });

    it('should return error with missing param and the provided node id', function(done) {
        var factory = new Factory('foo-user', DatabaseServiceStub);
        factory.create(missedParamTradeAreaAnalysisDefinition, function(err) {
            assert.ok(err, err);
            assert.equal(err.message, 'Missing required param "kind"');
            assert.equal(err.node_id, 'HEAD');
            done();
        });
    });

    it('should return error with missing param w/o node id', function(done) {
        var factory = new Factory('foo-user', DatabaseServiceStub);
        delete missedParamTradeAreaAnalysisDefinition.id;
        factory.create(missedParamTradeAreaAnalysisDefinition, function(err) {
            assert.ok(err, err);
            assert.equal(err.message, 'Missing required param "kind"');
            assert.ok(!err.node_id, err.node_id);
            done();
        });
    });

});
