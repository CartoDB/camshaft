'use strict';

var id = require('../../util/id');

var TYPE = 'source';

function Source(query, affectedTables, columnNames, params) {
    this.query = query;
    this.affectedTables = affectedTables;

    this.columns = columnNames;

    this.params = params || {};
}

module.exports.TYPE = TYPE;
module.exports.create = function(definition, factory, databaseService, callback) {
    databaseService.getAffectedTables(definition.params.query, function(err, affectedTables) {
        if (err) {
            return callback(err);
        }

        databaseService.getColumnNames(definition.params.query, function(err, columnNames) {
            if (err) {
                return callback(err);
            }

            return callback(null, new Source(definition.params.query, affectedTables, columnNames, definition.params));
        });
    });
};

// ------------------------------ PUBLIC API ------------------------------ //

Source.prototype.id = function() {
    return id(this.toJSON());
};

Source.prototype.getQuery = function() {
    return this.query;
};

Source.prototype.getColumns = function() {
    return this.columns;
};

Source.prototype.getInputNodes = function() {
    return [];
};

Source.prototype.getCacheTables = function() {
    return [];
};

Source.prototype.getAffectedTables = function() {
    return this.affectedTables;
};

Source.prototype.toJSON = function() {
    return {
        type: TYPE,
        query: this.query
    };
};

Source.prototype.toDot = function() {
    return {
        type: TYPE,
        color: 'green',
        nodes: {},
        attrs: {
            query: this.query
        }
    };
};

// ---------------------------- END PUBLIC API ---------------------------- //
