'use strict';

var assert = require('assert');
var Source = require('../../../lib/node/nodes/source');
var Moran = require('../../../lib/node/nodes/moran');

describe('moran', function() {

    var column = 'wadus_column';
    var source = new Source({query: 'select * from table'});

    it('should use knn as default w_type param', function() {
        var moran = new Moran({
            source: source,
            numerator_column: column,
            significance: 0.05
        });

        assert.equal(moran.w_type, 'knn');
    });

});
