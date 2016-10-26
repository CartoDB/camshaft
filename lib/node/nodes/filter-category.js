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
    beforeCreate: function (node) {
        node.category = new Category({ name: node.column }, {
            accept: node.accept,
            reject: node.reject
        });
    }
});

module.exports = FilterCategory;

FilterCategory.prototype.sql = function() {
    return this.category.sql(this.source.getQuery());
};

FilterCategory.prototype.computeRequirements = function(callback) {
    this.estimated_requirements = {
      result_rows: 2000000,
      result_size: 0,
      geocoding_calls: 0
    };
    this.limits = {
      result_rows: 1000000,
      result_size: 150000000,
      gecoding_calls: 1000
    };
    return callback(null, this.requirementMessages());
};
