'use strict';

var assert = require('assert');
var Source = require('../../../lib/node/nodes/source');
var FilterCategory = require('../../../lib/node/nodes/filter-category');

describe('filter-category', function () {
    var owner = 'localhost';
    var column = 'wadus_column';
    var source = new Source(owner, { query: 'select * from table' });

    it('should work with accept array param', function () {
        var filterCategory = new FilterCategory(owner, { source: source, column: column, accept: ['accept_val'] });

        assert.equal(filterCategory.column, column);
        assert.deepEqual(filterCategory.accept, ['accept_val']);
        assert.equal(filterCategory.reject, null);
    });

    it('should work with reject array param', function () {
        var filterCategory = new FilterCategory(owner, { source: source, column: column, reject: ['reject_val'] });

        assert.equal(filterCategory.column, column);
        assert.deepEqual(filterCategory.reject, ['reject_val']);
        assert.equal(filterCategory.accept, null);
    });

    it('should fail when min and max are not provided', function () {
        assert.throws(
            function () {
                new FilterCategory(owner, { source: source, column: column }); // eslint-disable-line no-new
            },
            function (err) {
                assert.equal(err.message, 'Category filter expects at least one array in accept or reject params');
                return true;
            }
        );
    });
});
