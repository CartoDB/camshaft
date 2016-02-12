'use strict';

var assert = require('assert');

var validator = require('../../lib/dag/validator');

var MockNode = require('./dag-mock-node');

describe('dag-validator', function() {

    it('should validate triangle', function() {
        // A --> B
        // |     |
        // |     v
        //  ---> C

        var cNode = new MockNode('C');
        var bNode = new MockNode('B', cNode);
        var aNode = new MockNode('A', [bNode, cNode]);

        assert.ok(validator.isValid(aNode));
    });

    it('should NOT validate a cycle', function() {
        // A --> B
        // ^     |
        // |     v
        // D <-- C

        var dNode = new MockNode('D', new MockNode('A'));
        var cNode = new MockNode('C', dNode);
        var bNode = new MockNode('B', cNode);
        var aNode = new MockNode('A', bNode);

        assert.ok(!validator.isValid(aNode));
    });

});
