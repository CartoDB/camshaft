'use strict';

var id = require('../util/id');

var TYPE = 'source';

function Source(query) {
    this.query = query;
}

module.exports.TYPE = TYPE;
module.exports.create = function(definition, factory, databaseService, callback) {
    return callback(null, new Source(definition.params.query));
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
