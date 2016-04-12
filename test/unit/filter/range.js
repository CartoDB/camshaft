'use strict';

var assert = require('assert');
var Range = require('../../../lib/filter/range');

describe('range-filter', function () {

    describe('without limits', function () {
        it('should throw an error', function() {
            var shouldThrow = function () {
                this.column = 'age';
                this.filterParams = {};
                this.range = new Range(this.column, this.filterParams);
            }.bind(this);

            assert.throws(shouldThrow, /Range filter/, 'did not throw with expected message');
        });
    });

    describe('with min value', function () {
        var EXPECTED_RANGE_SQL = 'SELECT * FROM (select age from population) _cdb_range_filter WHERE age >= 18';

        beforeEach(function () {
            this.column = 'age';
            this.filterParams = {
                min: 18
            };
            this.range = new Range(this.column, this.filterParams);
        });

        it('should retrieve a filter query', function() {
            var rangeSql = this.range.sql('select age from population');
            assert.equal(rangeSql, EXPECTED_RANGE_SQL);
        });
    });

    describe('with max value', function () {
        var EXPECTED_RANGE_SQL = 'SELECT * FROM (select age from population) _cdb_range_filter WHERE age <= 65';

        beforeEach(function () {
            this.column = 'age';
            this.filterParams = {
                max: 65
            };
            this.range = new Range(this.column, this.filterParams);
        });

        it('should retrieve a filter query', function() {
            var rangeSql = this.range.sql('select age from population');
            assert.equal(rangeSql, EXPECTED_RANGE_SQL);
        });
    });

    describe('with min and max values', function () {
        var EXPECTED_RANGE_SQL = [
            'SELECT * FROM (select age from population) _cdb_range_filter',
            'WHERE age BETWEEN 18 AND 65'
        ].join(' ');

        beforeEach(function () {
            this.column = 'age';
            this.filterParams = {
                min: 18,
                max: 65
            };
            this.range = new Range(this.column, this.filterParams);
        });

        it('should retrieve a filter query', function() {
            var rangeSql = this.range.sql('select age from population');
            assert.equal(rangeSql, EXPECTED_RANGE_SQL);
        });
    });
});
