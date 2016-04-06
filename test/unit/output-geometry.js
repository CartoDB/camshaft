'use strict';

var assert = require('assert');

var Node = require('../../lib/node/node');
var RandomGeometryNode = require('../../lib/node/nodes/random-geometry');
var BufferNode = require('../../lib/node/nodes/buffer');

describe('output-geometry', function() {

    it('should output correct point geometry type', function() {
        var randomGeometry = new RandomGeometryNode({geometry_type: 'point'});
        assert.equal(randomGeometry.geometry(), Node.GEOMETRY.POINT);
    });
    
    it('should output correct polygon geometry type', function() {
        var randomGeometry = new RandomGeometryNode({geometry_type: 'polygon'});
        assert.equal(randomGeometry.geometry(), Node.GEOMETRY.POLYGON);
    });

    it('should output correct geometry type', function() {
        var buffer = new BufferNode({
            source: new RandomGeometryNode({geometry_type: 'point'}),
            radio: 1000
        });
        assert.equal(buffer.geometry(), Node.GEOMETRY.POLYGON);
    });

    it('should fail to accept an invalid geometry type as input', function() {
        var polygonNode = new RandomGeometryNode({geometry_type: 'polygon'});
        assert.equal(polygonNode.geometry(), Node.GEOMETRY.POLYGON);

        var buffer;
        assert.throws(
            function() {
                buffer = new BufferNode({
                    source: polygonNode,
                    radio: 1000
                });
            },
            function(err) {
                assert.equal(
                    err.message,
                    'Invalid type for param "source", expects "node(point)" type, ' +
                        'got `{"type":"random-geometry","geometry_type":"polygon"}`'
                );
                return true;
            }
        );
    });

});
