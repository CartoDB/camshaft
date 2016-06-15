'use strict';

var assert = require('assert');

var Node = require('../../lib/node/node');

describe('node-creation', function() {

    describe('reserved keywords', function() {
        it('should fail for reserved param names', function() {
            var ReservedKeywordNode;
            assert.throws(
                function() {
                    ReservedKeywordNode = Node.create('test-reserved-keyword', { type: Node.PARAM.STRING() });
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

    var TestSource = Node.create('test-source', {query: Node.PARAM.STRING()});

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
            mandatory: Node.PARAM.STRING(),
            optional: Node.PARAM.NULLABLE(Node.PARAM.STRING())
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

    describe('Node.PARAM.ARRAY', function() {
        var ListNode = Node.create('test-array', {
            list: Node.PARAM.ARRAY()
        });

        it('should work for mixed arrays', function() {
            var listNode = new ListNode({ list: [ 1, 'wadus' ] });
            assert.deepEqual(listNode.list, [ 1, 'wadus' ]);
        });

        it('should work for empty arrays', function() {
            var listNode = new ListNode({ list: [] });
            assert.deepEqual(listNode.list, []);
        });

        describe('typed array', function() {
            var StringTypedListNode = Node.create('test-array-string', {
                list: Node.PARAM.ARRAY(Node.PARAM.STRING())
            });

            var NumberTypedListNode = Node.create('test-array-string', {
                list: Node.PARAM.ARRAY(Node.PARAM.NUMBER())
            });

            it('should work for string arrays', function() {
                var listNode = new StringTypedListNode({ list: [ 'wadus', 'wadus' ] });
                assert.deepEqual(listNode.list, [ 'wadus', 'wadus' ]);
            });

            it('should work for number arrays', function() {
                var listNode = new NumberTypedListNode({ list: [ 1, 2, 3, 4 ] });
                assert.deepEqual(listNode.list, [ 1, 2, 3, 4 ]);
            });

            it('should fail for mixed arrays', function() {
                var listNode;

                assert.throws(
                    function() {
                        listNode = new StringTypedListNode({ list: [ 1, 'wadus' ] });
                    },
                    function(err) {
                        assert.equal(
                            err.message,
                            'Invalid type for param "list", expects "array<string>" type, got `[1,"wadus"]`'
                        );
                        return true;
                    }
                );
            });

            it('should fail for mixed arrays', function() {
                var listNode;

                assert.throws(
                    function() {
                        listNode = new NumberTypedListNode({ list: [ 1, 'wadus' ] });
                    },
                    function(err) {
                        assert.equal(
                            err.message,
                            'Invalid type for param "list", expects "array<number>" type, got `[1,"wadus"]`'
                        );
                        return true;
                    }
                );
            });

            describe('nullable', function() {
                var NullableStringTypedListNode = Node.create('test-array-string', {
                    list: Node.PARAM.NULLABLE(Node.PARAM.ARRAY(Node.PARAM.STRING()))
                });

                it('should work for null param', function() {
                    var listNode = new NullableStringTypedListNode({});
                    assert.equal(listNode.list, null);
                });

                it('still should fail for mixed arrays', function() {
                    var listNode;

                    assert.throws(
                        function() {
                            listNode = new NullableStringTypedListNode({ list: [ 1, 'wadus' ] });
                        },
                        function(err) {
                            assert.equal(
                                err.message,
                                'Invalid type for param "list", expects "array<string>" type, got `[1,"wadus"]`'
                            );
                            return true;
                        }
                    );
                });

            });
        });
    });

    describe('Node custom validate', function() {
        var validList = [1, 2, 3, 4];
        var CustomValidationNode = Node.create('test-custom-validation', { list: Node.PARAM.ARRAY() }, {
            beforeCreate: function(node) {
                assert.deepEqual(node.list, validList, 'Custom validation throws this');
            }
        });

        it('should work for expected array list', function () {
            var customValidationNode = new CustomValidationNode({ list: validList });
            assert.deepEqual(customValidationNode.list, validList);
        });

        it('should fail for unexpected array list', function() {
            var customValidationNode;

            assert.throws(
                function() {
                    customValidationNode = new CustomValidationNode({ list: [1] });
                },
                function(err) {
                    assert.equal(err.message, 'Custom validation throws this');
                    return true;
                }
            );
        });
    });

    describe('Node ignoreParamForId', function() {
        var ANode = Node.create('test-a-with-ignored-b', { a: Node.PARAM.STRING() });
        var ABNode = Node.create('test-a-with-ignored-b', { a: Node.PARAM.STRING(), b: Node.PARAM.STRING() });
        var AIgnoredBNode = Node.create('test-a-with-ignored-b', { a: Node.PARAM.STRING(), b: Node.PARAM.STRING() }, {
            beforeCreate: function(node) {
                node.ignoreParamForId('b');
            }
        });

        it('should have different id for A and AB nodes', function () {
            var aNode = new ANode({a: 'a'});
            var abNode = new ABNode({a: 'a', b: 'b'});
            assert.notEqual(aNode.id(), abNode.id());
        });

        it('should have same id for A and AIgnoredB nodes', function () {
            var aNode = new ANode({a: 'a'});
            var abNode = new AIgnoredBNode({a: 'a', b: 'b'});
            assert.equal(aNode.id(), abNode.id());
        });
    });

    describe('Node validator defaultValue', function() {
        var nullableParamTypes = Object.keys(Node.PARAM)
            .filter(function(paramType) { return paramType !== 'NULLABLE' && paramType !== 'NODE'; });

        nullableParamTypes.forEach(function(paramType) {
            it('should default to null for non provided "' + paramType + '" param', function () {
                var ANode = Node.create('test-default-value-' + paramType, {
                    a: Node.PARAM.NULLABLE(Node.PARAM[paramType]())
                });
                var aNode = new ANode({});
                assert.equal(aNode.a, null);
            });
        });

        it('should default to first value for non provided ENUM value', function () {
            var ANode = Node.create('test-default-value', {
                a: Node.PARAM.NULLABLE(Node.PARAM.ENUM('a', 'b', 'c'))
            });
            var aNode = new ANode({});
            assert.equal(aNode.a, 'a');
        });
    });

});
