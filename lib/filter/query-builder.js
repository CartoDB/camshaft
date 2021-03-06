'use strict';

module.exports.getSql = function QueryBuilder$getSql (query, filters, applyFilters, columns) {
    filters = filters || {};
    applyFilters = applyFilters || {};
    columns = columns || {};

    return Object.keys(filters)
        .filter(function (filterName) {
            return Object.prototype.hasOwnProperty.call(applyFilters, filterName) ? applyFilters[filterName] : true;
        })
        .map(function (filterName) {
            var filterDefinition = filters[filterName];
            return createFilter(columns, filterDefinition);
        })
        .reduce(function (sql, filter) {
            return filter.sql(sql);
        }, query);
};

var filters = {
    category: require('./category'),
    range: require('./range'),
    rank: require('./rank'),
    'grouped-rank': require('./grouped-rank')
};

function createFilter (columns, filterDefinition) {
    var filterType = filterDefinition.type.toLowerCase();
    if (!Object.prototype.hasOwnProperty.call(filters, filterType)) {
        throw new Error('Unknown filter type: ' + filterType);
    }
    var columnName = filterDefinition.column;
    var column = {
        name: columnName
    };
    if (Object.prototype.hasOwnProperty.call(columns, columnName)) {
        column.type = columns[columnName];
    }
    return new filters[filterType](column, filterDefinition.params, columns);
}
