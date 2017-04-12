'use strict';

var assert = require('assert');

var Node = require('../../lib/node/node');

describe('node-creation', function() {

    var owner = 'localhost';

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
        var source = new TestSource(owner, { query: QUERY });
        assert.equal(source.query, QUERY);
    });

    it('should fail for missing params', function() {
        var source;
        assert.throws(
            function() {
                 source = new TestSource(owner, {});
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
                source = new TestSource(owner, { query: 2 });
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
                var enumSource = new EnumSource(owner, { classification: classification });
                assert.equal(enumSource.classification, classification);
            });
        });

        it('should fail for invalid ENUM values', function() {
            var enumSource;
            assert.throws(
                function() {
                    enumSource = new EnumSource(owner, { classification: 'wadus' });
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
            var nullableNode = new NullableNode(owner, { mandatory: 'wadus_mandatory', optional: 'wadus_optional' });
            assert.equal(nullableNode.mandatory, 'wadus_mandatory');
            assert.equal(nullableNode.optional, 'wadus_optional');
        });

        it('should fail for invalid PARAM type', function() {
            var nullableNode;
            assert.throws(
                function() {
                    nullableNode = new NullableNode(owner, { mandatory: 'wadus_mandatory', optional: 1 });
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
                    nullableNode = new NullableNode(owner, { mandatory: 'wadus_mandatory', optional: 0 });
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
            var nullableNode = new NullableNode(owner, { mandatory: 'wadus_mandatory', optional: null });
            assert.equal(nullableNode.mandatory, 'wadus_mandatory');
            assert.equal(nullableNode.optional, null);
        });

        it('should allow to use undefined values for NULLABLE params', function() {
            var nullableNode = new NullableNode(owner, { mandatory: 'wadus_mandatory' });
            assert.equal(nullableNode.mandatory, 'wadus_mandatory');
            assert.equal(nullableNode.optional, null);
        });

        it('should accept accept nullable geometry params', function() {
            var NullableGeometryNode = Node.create('test-geometry-nullable', {
                mandatory: Node.PARAM.STRING(),
                optional_node: Node.PARAM.NULLABLE(Node.PARAM.NODE())
            });
            var nullableGeometryNode = new NullableGeometryNode(owner, {
                mandatory: 'wadus_mandatory'
            });

            assert.equal(nullableGeometryNode.mandatory, 'wadus_mandatory');
            assert.equal(nullableGeometryNode.optional_node, null);
        });

    });

    describe('Node.PARAM.ARRAY', function() {
        var ListNode = Node.create('test-array', {
            list: Node.PARAM.ARRAY()
        });

        it('should work for mixed arrays', function() {
            var listNode = new ListNode(owner, { list: [ 1, 'wadus' ] });
            assert.deepEqual(listNode.list, [ 1, 'wadus' ]);
        });

        it('should work for empty arrays', function() {
            var listNode = new ListNode(owner, { list: [] });
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
                var listNode = new StringTypedListNode(owner, { list: [ 'wadus', 'wadus' ] });
                assert.deepEqual(listNode.list, [ 'wadus', 'wadus' ]);
            });

            it('should work for number arrays', function() {
                var listNode = new NumberTypedListNode(owner, { list: [ 1, 2, 3, 4 ] });
                assert.deepEqual(listNode.list, [ 1, 2, 3, 4 ]);
            });

            it('should fail for mixed arrays', function() {
                var listNode;

                assert.throws(
                    function() {
                        listNode = new StringTypedListNode(owner, { list: [ 1, 'wadus' ] });
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
                        listNode = new NumberTypedListNode(owner, { list: [ 1, 'wadus' ] });
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
                    var listNode = new NullableStringTypedListNode(owner, {});
                    assert.equal(listNode.list, null);
                });

                it('still should fail for mixed arrays', function() {
                    var listNode;

                    assert.throws(
                        function() {
                            listNode = new NullableStringTypedListNode(owner, { list: [ 1, 'wadus' ] });
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
            var customValidationNode = new CustomValidationNode(owner, { list: validList });
            assert.deepEqual(customValidationNode.list, validList);
        });

        it('should fail for unexpected array list', function() {
            var customValidationNode;

            assert.throws(
                function() {
                    customValidationNode = new CustomValidationNode(owner, { list: [1] });
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
            var aNode = new ANode(owner, {a: 'a'});
            var abNode = new ABNode(owner, {a: 'a', b: 'b'});
            assert.notEqual(aNode.id(), abNode.id());
        });

        it('should have same id for A and AIgnoredB nodes', function () {
            var aNode = new ANode(owner, {a: 'a'});
            var abNode = new AIgnoredBNode(owner, {a: 'a', b: 'b'});
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
                var aNode = new ANode(owner, {});
                assert.equal(aNode.a, null);
            });
        });

        it('should default to first value for non provided ENUM value', function () {
            var ANode = Node.create('test-default-value', {
                a: Node.PARAM.NULLABLE(Node.PARAM.ENUM('a', 'b', 'c'))
            });
            var aNode = new ANode(owner, {});
            assert.equal(aNode.a, 'a');
        });

        it('can override default value with nullable param', function () {
            var ANode = Node.create('test-default-value', {
                a: Node.PARAM.NULLABLE(Node.PARAM.ENUM('a', 'b', 'c'), 'b')
            });
            var aNode = new ANode(owner, {});
            assert.equal(aNode.a, 'b');
        });

        it('can use boolean false values', function () {
            var ANode = Node.create('test-default-value', {
                a: Node.PARAM.NULLABLE(Node.PARAM.ENUM(false, true))
            });
            var aNode = new ANode(owner, {});
            assert.equal(aNode.a, false);
        });

        it('can override with false false value', function () {
            var ANode = Node.create('test-default-value', {
                a: Node.PARAM.NULLABLE(Node.PARAM.ENUM(true, false), false)
            });
            var aNode = new ANode(owner, {});
            assert.equal(aNode.a, false);
        });
    });

    describe('Cached table names', function() {

        it('should be 60 chars at max for long type names', function() {
            var ANode = Node.create('test-default-value', {
                a: Node.PARAM.NULLABLE(Node.PARAM.STRING())
            });

            var aNode = new ANode(owner, {});
            assert.equal(aNode.getTargetTable().length, 60);
        });

        it('should be 60 chars also for short type names', function() {
            var ANode = Node.create('t', {
                a: Node.PARAM.NULLABLE(Node.PARAM.STRING())
            });

            var aNode = new ANode(owner, {});
            assert.equal(aNode.getTargetTable().length, 60);
        });

    });

    describe('Validator', function() {
        var SchemaValidatedNode = Node.create('validated-schema', {}, {
            validators: [new Node.Validator.Schema([
                {
                    name: 'cartodb_id',
                    type: 'number'
                },
                {
                    name: 'the_geom',
                    type: 'geometry'
                },
                {
                    name: 'wadus',
                    type: 'number'
                }
            ])]
        });

        it('should work when schema is valid', function() {
            var node = new SchemaValidatedNode(owner, {});
            node.setColumns([
                {
                    name: 'cartodb_id',
                    type: 'number'
                },
                {
                    name: 'the_geom',
                    type: 'geometry'
                },
                {
                    name: 'wadus',
                    type: 'number'
                }
            ]);
            assert.ok(node.isValid());
        });

        it('should fail when schema is missing a column', function() {
            var node = new SchemaValidatedNode(owner, {});
            node.setColumns([
                {
                    name: 'cartodb_id',
                    type: 'number'
                },
                {
                    name: 'the_geom',
                    type: 'geometry'
                }
            ]);
            var errors = [];
            assert.equal(node.isValid(errors), false);
            assert.equal(errors.length, 1);
            assert.equal(errors[0].message, 'Missing required column `wadus`');
        });

        it('should fail when schema is missing more than a column', function() {
            var node = new SchemaValidatedNode(owner, {});
            node.setColumns([
                {
                    name: 'the_geom',
                    type: 'geometry'
                }
            ]);
            var errors = [];
            assert.equal(node.isValid(errors), false);
            assert.equal(errors.length, 2);
            assert.equal(errors[0].message, 'Missing required column `cartodb_id`');
            assert.equal(errors[1].message, 'Missing required column `wadus`');
        });

        it('should fail when schema type does not match', function() {
            var node = new SchemaValidatedNode(owner, {});
            node.setColumns([
                {
                    name: 'the_geom',
                    type: 'number'
                }
            ]);
            var errors = [];
            assert.equal(node.isValid(errors), false);
            assert.equal(errors.length, 3);
            assert.equal(errors[0].message, 'Missing required column `cartodb_id`');
            assert.equal(errors[1].message, 'Invalid type for column "the_geom": expected `the_geom` got `number`');
            assert.equal(errors[2].message, 'Missing required column `wadus`');
        });
    });
});
