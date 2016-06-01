'use strict';

var assert = require('assert');
var Category = require('../../../lib/filter/category');

describe('category-filter', function () {

    describe('without category filters', function () {
        it('should throw an error', function() {
            var shouldThrow = function () {
                this.column = { name: 'continent' };
                this.filterParams = {};
                this.range = new Category(this.column, this.filterParams);
            }.bind(this);

            assert.throws(
                shouldThrow,
                /Category filter expects at least one array /,
                'did not throw with expected messcontinent'
            );
        });
    });

    describe('with empty category filters', function () {
        it('should throw an error', function() {
            var shouldThrow = function () {
                this.column = { name: 'continent' };
                this.filterParams = {
                    accept: [],
                    reject: []
                };
                this.range = new Category(this.column, this.filterParams);
            }.bind(this);

            assert.throws(
                shouldThrow,
                /Category filter expects one value/,
                'did not throw with expected messcontinent'
            );
        });
    });

    describe('with only accept values', function () {
        var EXPECTED_CATEGORY_SQL =[
            'SELECT *',
            'FROM (select continent from populated_places) _camshaft_category_filter',
            'WHERE continent IN ($escape_0$Europe$escape_0$)'
        ].join('\n');

        beforeEach(function () {
            this.column = { name: 'continent' };
            this.filterParams = {
                accept: ['Europe']
            };
            this.category = new Category(this.column, this.filterParams);
        });

        it('should retrieve a filtered query', function() {
            var categorySql = this.category.sql('select continent from populated_places');
            assert.equal(categorySql, EXPECTED_CATEGORY_SQL);
        });
    });

    describe('with only reject values', function () {
        var EXPECTED_CATEGORY_SQL =[
            'SELECT *',
            'FROM (select continent from populated_places) _camshaft_category_filter',
            'WHERE continent NOT IN ($escape_0$Europe$escape_0$)'
        ].join('\n');

        beforeEach(function () {
            this.column = { name: 'continent' };
            this.filterParams = {
                reject: ['Europe']
            };
            this.category = new Category(this.column, this.filterParams);
        });

        it('should retrieve a filtered query', function() {
            var categorySql = this.category.sql('select continent from populated_places');
            assert.equal(categorySql, EXPECTED_CATEGORY_SQL);
        });
    });

    describe('accepting all values', function () {
        var EXPECTED_CATEGORY_SQL =[
            'SELECT *',
            'FROM (select continent from populated_places) _camshaft_category_filter',
            'WHERE 1 = 1'
        ].join('\n');

        beforeEach(function () {
            this.column = { name: 'continent' };
            this.filterParams = {
                reject: []
            };
            this.category = new Category(this.column, this.filterParams);
        });

        it('should retrieve a filtered query', function() {
            var categorySql = this.category.sql('select continent from populated_places');
            assert.equal(categorySql, EXPECTED_CATEGORY_SQL);
        });
    });

    describe('rejecting all values', function () {
        var EXPECTED_CATEGORY_SQL =[
            'SELECT *',
            'FROM (select continent from populated_places) _camshaft_category_filter',
            'WHERE 0 = 1'
        ].join('\n');

        beforeEach(function () {
            this.column = { name: 'continent' };
            this.filterParams = {
                accept: []
            };
            this.category = new Category(this.column, this.filterParams);
        });

        it('should retrieve a filtered query', function() {
            var categorySql = this.category.sql('select continent from populated_places');
            assert.equal(categorySql, EXPECTED_CATEGORY_SQL);
        });
    });
});
