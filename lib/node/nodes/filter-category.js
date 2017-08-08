'use strict';

var Node = require('../node');
var Category = require('../../filter/category');

var TYPE = 'filter-category';
var PARAMS = {
    source: Node.PARAM.NODE(Node.GEOMETRY.ANY),
    column: Node.PARAM.STRING(),
    accept: Node.PARAM.NULLABLE(Node.PARAM.ARRAY()),
    reject: Node.PARAM.NULLABLE(Node.PARAM.ARRAY())
};

var FilterCategory = Node.create(TYPE, PARAMS, {
    beforeCreate: function () {
        this.category = new Category({ name: this.column }, {
            accept: this.accept,
            reject: this.reject
        });
    }
});

module.exports = FilterCategory;

FilterCategory.prototype.sql = function() {
    return this.category.sql(this.source.getQuery());
};
