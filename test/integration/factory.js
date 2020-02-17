'use strict';

var assert = require('assert');

var Node = require('../../lib/node/node');
var DatabaseService = require('../../lib/service/database');
var Factory = require('../../lib/workflow/factory');
var Sampling = require('../../lib/node/nodes/sampling');

var TestConfig = require('../test-config');

const RANGE_FILTERS_ERROR_MESSAGE = 'Range filter expect to have at least one value in ' +
                                    'greater_than, greater_than_or_equal, ' +
                                    'less_than, less_than_or_equal, min, or max numeric params';

describe('factory', function() {

    before(function() {
        var configuration = TestConfig.create({ batch: { inlineExecution: true } });
        this.configuration = configuration;
        this.databaseService = new DatabaseService(
            configuration.user,
            configuration.db,
            configuration.batch,
            configuration.limits
        );
    });

    it('basic test-source node', function(done) {
        var TEST_SOURCE_TYPE = 'test-source';
        var TestSource = Node.create(TEST_SOURCE_TYPE, {
            table: Node.PARAM.STRING()
        }, { cache: true });
        TestSource.prototype.sql = function() {
            return `select * from ${this.table}`;
        };

        var definition = {
            type: TEST_SOURCE_TYPE,
            params: {
                table: 'airbnb_rooms'
            }
        };

        var typeNodeMap = {};
        typeNodeMap[TEST_SOURCE_TYPE] = TestSource;

        var factory = new Factory(this.configuration.user, this.databaseService, typeNodeMap);
        factory.create(definition, function(err, rootNode) {
            assert.ifError(err);

            assert.equal(rootNode.getType(), TEST_SOURCE_TYPE);
            assert.equal(rootNode.sql(), 'select * from airbnb_rooms');
            assert.ok(rootNode.getQuery().match(/^select \* from analysis_/));

            return done();
        });
    });

    it('invalid filters in createCacheTable', function(done) {
        const TEST_SOURCE_TYPE = 'test-source';
        const TestSource = Node.create(TEST_SOURCE_TYPE, {
            table: Node.PARAM.STRING()
        }, { cache: true });
        TestSource.prototype.sql = function() {
            return `select * from ${this.table}`;
        };

        const invalidFilters = {
            price: {
                type: 'range',
                column: 'price',
                params: {
                }
            }
        };
        const sourceDefinition = {
            type: TEST_SOURCE_TYPE,
            params: {
                table: 'airbnb_rooms',
            }
        };
        const samplingDefinition = {
            type: 'sampling',
            params: {
                source: sourceDefinition,
                sampling: 1,
                seed: 12345,
                filters: invalidFilters
            }
        };
        const definition = {
            type: 'sampling',
            params: {
                source: samplingDefinition,
                sampling: 1,
                seed: 12345,
            }
        };

        const typeNodeMap = {};
        typeNodeMap[TEST_SOURCE_TYPE] = TestSource;
        typeNodeMap.sampling = Sampling;

        const factory = new Factory(this.configuration.user, this.databaseService, typeNodeMap);
        factory.create(definition, function(err) {
            assert.equal(err.message, RANGE_FILTERS_ERROR_MESSAGE);
            return done();
        });
    });
});
