'use strict';

module.exports.getSql = function QueryBuilder$getSql(query, filters, applyFilters) {
    filters = filters || {};
    applyFilters = applyFilters || {};

    return Object.keys(filters)
        .filter(function(filterName) {
            return applyFilters.hasOwnProperty(filterName) ? applyFilters[filterName] : true;
        })
        .map(function(filterName) {
            var filterDefinition = filters[filterName];
            return createFilter(filterDefinition);
        })
        .reduce(function(sql, filter) {
            return filter.sql(sql);
        }, query);
};

var filters = {
    category: require('./category'),
    range: require('./range')
};

function createFilter(filterDefinition) {
    var filterType = filterDefinition.type.toLowerCase();
    if (!filters.hasOwnProperty(filterType)) {
        throw new Error('Unknown filter type: ' + filterType);
    }
    return new filters[filterType](filterDefinition.column, filterDefinition.params);
}
