'use strict';

var dot = require('dot');
dot.templateSettings.strip = false;

var limitedQuery = dot.template('SELECT * FROM ({{=it._query}}) __camshaft_schema LIMIT 0');

function QueryParser(queryRunner) {
    this.queryRunnner = queryRunner;
}

module.exports = QueryParser;

QueryParser.prototype.getColumns = function(query, callback) {
    this.queryRunnner.run(limitedQuery({ _query: query }), function(err, resultSet) {
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

QueryParser.prototype.getColumnNames = function(query, callback) {
    this.getColumns(query, function(err, columns) {
        if (err) {
            return callback(err);
        }

        return callback(null, columns.map(function(column) {
            return column.name;
        }));
    });
};
