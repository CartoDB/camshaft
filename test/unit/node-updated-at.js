'use strict';

var assert = require('assert');

var Node = require('../../lib/node/node');

describe('node-updated-at', function() {

    function assertEqualTime(d1, d2) {
        if (d1 === null) {
            throw new Error('First argument must be a Date');
        }

        if (d2 === null) {
            throw new Error('Second argument must be a Date');
        }

        assert.equal(d1.getTime(), d2.getTime());
    }

    var owner = 'localhost';
    var START_TIME = new Date('1970-01-01T00:00:00.000Z');

    var FooSourceNode = Node.create('foo-source', { buster: Node.PARAM.STRING() }, {
        beforeCreate: function() {
            this.setUpdatedAt(START_TIME);
        }
    });

    var ChildNode = Node.create('child', {
        source: Node.PARAM.NODE()
    });


    it('should retrieve parent node updated at with getLastUpdatedAtFromInputNodes', function() {
        var aFooSource = new FooSourceNode(owner, { buster: 'a' });
        var childNode = new ChildNode(owner, { source: aFooSource });
        assert.equal(childNode.getUpdatedAt(), null);
        assertEqualTime(aFooSource.getUpdatedAt(), childNode.getLastUpdatedAtFromInputNodes());
    });
});
