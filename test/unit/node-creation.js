'use strict';

var assert = require('assert');

var Node = require('../../lib/node/node');

describe('node-creation', function() {

    describe('reserved keywords', function() {
        it.only('should fail for reserved param names', function() {
            var ReservedKeywordNode;
            assert.throws(
                function() {
                    ReservedKeywordNode = Node.create('test-reserved-keyword', { type: Node.PARAM.STRING });
                },
                function(err) {
                    assert.equal(
                        err.message,
                        'Invalid param name "type". It is a reserved keyword.'
                    );
                    return true;
                }
            );
        });

    });

    var TestSource = Node.create('test-source', {query: Node.PARAM.STRING});

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
                assert.equal(err.message, 'Invalid type for param "query", expects "string" type, got `2`');
                return true;
            }
        );
    });

    describe('Node.PARAM.ENUM', function() {
        var EnumSource = Node.create('test-source', { classification: Node.PARAM.ENUM('knn', 'queen') });

        it('should check ENUM uses one of the values', function() {
            var CLASSIFICATIONS = ['knn', 'queen'];
            CLASSIFICATIONS.forEach(function(classification) {
                var enumSource = new EnumSource({ classification: classification });
                assert.equal(enumSource.classification, classification);
            });
        });

        it('should fail for invalid ENUM values', function() {
            var enumSource;
            assert.throws(
                function() {
                    enumSource = new EnumSource({ classification: 'wadus' });
                },
                function(err) {
                    assert.equal(
                        err.message,
                        'Invalid type for param "classification", expects "enum("knn","queen")" type, got `"wadus"`'
                    );
                    return true;
                }
            );
        });

    });

    describe('Node.PARAM.NULLABLE', function() {
        var NullableNode = Node.create('test-nullable', {
            mandatory: Node.PARAM.STRING,
            optional: Node.PARAM.NULLABLE(Node.PARAM.STRING)
        });

        it('should work for valid params', function() {
            var nullableNode = new NullableNode({ mandatory: 'wadus_mandatory', optional: 'wadus_optional' });
            assert.equal(nullableNode.mandatory, 'wadus_mandatory');
            assert.equal(nullableNode.optional, 'wadus_optional');
        });

        it('should fail for invalid PARAM type', function() {
            var nullableNode;
            assert.throws(
                function() {
                    nullableNode = new NullableNode({ mandatory: 'wadus_mandatory', optional: 1 });
                },
                function(err) {
                    assert.equal(
                        err.message,
                        'Invalid type for param "optional", expects "string" type, got `1`'
                    );
                    return true;
                }
            );
        });

        it('should fail for invalid PARAM type with falsy values', function() {
            var nullableNode;
            assert.throws(
                function() {
                    nullableNode = new NullableNode({ mandatory: 'wadus_mandatory', optional: 0 });
                },
                function(err) {
                    assert.equal(
                        err.message,
                        'Invalid type for param "optional", expects "string" type, got `0`'
                    );
                    return true;
                }
            );
        });

        it('should allow to use null values for NULLABLE params', function() {
            var nullableNode = new NullableNode({ mandatory: 'wadus_mandatory', optional: null });
            assert.equal(nullableNode.mandatory, 'wadus_mandatory');
            assert.equal(nullableNode.optional, null);
        });

        it('should allow to use undefined values for NULLABLE params', function() {
            var nullableNode = new NullableNode({ mandatory: 'wadus_mandatory' });
            assert.equal(nullableNode.mandatory, 'wadus_mandatory');
            assert.equal(nullableNode.optional, null);
        });

    });

});
