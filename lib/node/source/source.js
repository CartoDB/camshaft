'use strict';

var id = require('../../util/id');

var TYPE = 'source';

function Source(query, affectedTables, columnNames, params) {
    this.query = query;
    this.affectedTables = affectedTables;

    this.columns = columnNames;

    this.params = params || {};
}

module.exports = Source;
module.exports.TYPE = TYPE;
module.exports.create = require('./factory').create;

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
