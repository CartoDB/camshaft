'use strict';

var assert = require('assert');

var Node = require('../../lib/node/node');

describe('node-creation', function() {

    var TestSource = Node.create('test-source', {query: Node.PARAM_TYPE.TEXT});

    it('should validate params', function() {
        var QUERY = 'select * from table';
        var source = new TestSource({ query: QUERY });
        assert.equal(source.query, QUERY);
    });

    it('should fail for missing params', function() {
        var source;
        assert.throws(
            function() {
                 source = new TestSource({});
            },
            function(err) {
                assert.equal(err.message, 'Missing required param "query"');
                return true;
            }
        );
    });

    it('should fail for invalid param type', function() {
        var source;
        assert.throws(
            function() {
                source = new TestSource({ query: 2 });
            },
            function(err) {
                assert.equal(err.message, 'Invalid type for param "query", expects "TEXT" type, got `2`');
                return true;
            }
        );
    });

    describe('Node.PARAM_TYPE.ENUM', function() {
        var EnumSource = Node.create('test-source', { type: Node.PARAM_TYPE.ENUM('knn', 'queen') });

        it('should check ENUM uses one of the values', function() {
            var TYPES = ['knn', 'queen'];
            TYPES.forEach(function(type) {
                var enumSource = new EnumSource({ type: type });
                assert.equal(enumSource.type, type);
            });
        });

        it('should fail for invalid ENUM values', function() {
            var enumSource;
            assert.throws(
                function() {
                    enumSource = new EnumSource({ type: 'wadus' });
                },
                function(err) {
                    assert.equal(
                        err.message,
                        'Invalid type for param "type", expects "ENUM("knn","queen")" type, got `"wadus"`'
                    );
                    return true;
                }
            );
        });

    });

});
