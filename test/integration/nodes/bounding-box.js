'use strict';

var assert = require('assert');
var Source = require('../../../lib/node/nodes/source');
var BoundingBox = require('../../../lib/node/nodes/bounding-box');

describe('bounding-box', function() {
    var owner = 'localhost';
    var source = new Source(owner, { query: 'select * from table' });

    it('should throw exception while validates param', function() {
        assert.throws(function () {
            var bbox = new BoundingBox(owner, { source: source, aggregation: 'avg' });
        }, 'Param `aggregation` != "count" requires an existent `aggregation_column` column')
    });
});
