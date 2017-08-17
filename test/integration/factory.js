'use strict';

var assert = require('assert');

var Node = require('../../lib/node/node');
var DatabaseService = require('../../lib/service/database');
var Factory = require('../../lib/workflow/factory');

var TestConfig = require('../test-config');

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
            return 'select * from ' + this.table;
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
});
