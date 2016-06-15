'use strict';

var assert = require('assert');
var nodes = require('../../../lib/node');

describe('moran', function() {

    var column = 'wadus_column';
    var source = new nodes.Source({query: 'select * from table'});

    it('should use knn as default w_type param', function() {
        var moran = new nodes.Moran({
            source: source,
            numerator_column: column,
            significance: 0.05
        });

        assert.equal(moran.w_type, 'knn');
    });

});
