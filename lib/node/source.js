'use strict';

var id = require('../util/id');

var TYPE = 'source';

function Source(query, affectedTables) {
    this.query = query;
    this.affectedTables = affectedTables;
}

module.exports.TYPE = TYPE;
module.exports.create = function(definition, factory, databaseService, callback) {
    databaseService.getAffectedTables(definition.params.query, function(err, affectedTables) {
        if (err) {
            return callback(err);
        }

        return callback(null, new Source(definition.params.query, affectedTables));
    });
};

// ------------------------------ PUBLIC API ------------------------------ //

Source.prototype.id = function() {
    return id(this.toJSON());
};

Source.prototype.getQuery = function() {
    return this.query;
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
