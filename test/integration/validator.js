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
        getLastUpdatedTimeFromAffectedTables: createServiceStub([]),
        createTableIfNotExists: function(table, query, callback) {
            return callback(null, true);
        },
        registerNodesInCatalog: createServiceStub([]),
        trackNode: createServiceStub([]),
        enqueue: createServiceStub({})
    };

    it('should validate graph', function(done) {
        var factory = new Factory(DatabaseServiceStub);
        factory.create(tradeAreaAnalysisDefinition, function(err, node) {
            assert.ok(!err, err);

            assert.ok(validator.isValid(node));

            done();
        });
    });

});
