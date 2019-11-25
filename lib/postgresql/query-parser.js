'use strict';

var dot = require('dot');
dot.templateSettings.strip = false;

var queries = require('../postgresql/queries');

var limitedQuery = dot.template('SELECT * FROM ({{=it._query}}) __camshaft_schema LIMIT 0');

function QueryParser(queryRunner) {
    this.queryRunnner = queryRunner;
}

module.exports = QueryParser;

QueryParser.prototype.getColumns = function(query, callback) {
    var _query = queries.replaceTokens(query);
    this.queryRunnner.run(limitedQuery({ _query: _query }), function(err, resultSet) {
        var fields = resultSet.fields || [];
        fields = fields.map(function(field) {
            return {
                name: field.name,
                type: field.type
            };
        });
        return callback(err, fields);
    });
};
