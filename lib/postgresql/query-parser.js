'use strict';

function QueryParser(queryRunner) {
    this.queryRunnner = queryRunner;
}

module.exports = QueryParser;

QueryParser.prototype.getSchema = function(query, callback) {
    this.queryRunnner.run(query, function(err, resultSet) {
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
    this.getSchema(query, function(err, columns) {
        if (err) {
            return callback(err);
        }

        return callback(null, columns.map(function(column) {
            return column.name;
        }));
    });
};
