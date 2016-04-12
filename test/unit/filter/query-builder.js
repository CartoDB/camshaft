'use strict';

var assert = require('assert');
var queryBuilder = require('../../../lib/filter/query-builder');

describe('query-builder-filter', function () {

    it('.getSql() without filters should return the same query', function () {
        var EXPECTED_QUERY = 'select * form populated_places';
        var query = queryBuilder.getSql(EXPECTED_QUERY);

        assert.equal(query, EXPECTED_QUERY);
    });

    it('.getSql() with category filter should return a filtered query', function () {
        var sql = 'select * form populated_places';
        var EXPECTED_QUERY = [
            'SELECT *',
            'FROM (select * form populated_places) _cdb_category_filter',
            'WHERE age IN (25)'
        ].join('\n');

        var query = queryBuilder.getSql(sql, {
            age_category: {
                type: 'category',
                column: 'age',
                params: {
                    accept: [25]
                }
            }
        });

        assert.equal(query, EXPECTED_QUERY);
    });

    it('.getSql() with wadus filter should throw an error', function () {
        var sql = 'select * form populated_places';

        var shouldThrow = function () {
            queryBuilder.getSql(sql, {
                age_category: {
                    type: 'wadus',
                    column: 'age',
                    params: {
                        accept: [25]
                    }
                }
            });
        };

        assert.throws(shouldThrow, /Unknown filter type/, 'did not throw with expected message');
    });

});
