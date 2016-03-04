'use strict';

var id = require('../util/id');

var TYPE = 'buffer';

function Buffer(inputNode, radio, columns, params) {
    this.inputNode = inputNode;
    this.radio = radio;
    this.columns = columns;

    this.params = params;
}

module.exports.TYPE = TYPE;
module.exports.create = function(definition, factory, databaseService, callback) {
    factory.create(definition.params.source, function(err, node) {
        if (err) {
            return callback(err);
        }

        databaseService.getColumnNames(node.getQuery(), function(err, columnNames) {
            if (err) {
                return callback(err);
            }

            return callback(null, new Buffer(node, definition.params.radio, columnNames, definition.params));
        });
    });
};

// ------------------------------ PUBLIC API ------------------------------ //

Buffer.prototype.id = function() {
    return id(this.toJSON());
};

Buffer.prototype.getQuery = function() {
    return bufferQuery(this.inputNode.getQuery(), this.columns, this.radio);
};

Buffer.prototype.getColumns = function() {
    return this.columns;
};

Buffer.prototype.getInputNodes = function() {
    return [this.inputNode];
};

Buffer.prototype.getCacheTables = function() {
    return [];
};

Buffer.prototype.getAffectedTables = function() {
    return [];
};

Buffer.prototype.toJSON = function() {
    return {
        type: TYPE,
        inputNodeId: this.inputNode.id(),
        radio: this.radio
    };
};

Buffer.prototype.toDot = function() {
    return {
        type: TYPE,
        color: 'orange',
        nodes: {
            inputNode: this.inputNode
        },
        attrs: {
            radio: this.radio
        }
    };
};

// ---------------------------- END PUBLIC API ---------------------------- //

function bufferQuery(inputQuery, columnNames, distance) {
    return [
        'SELECT ST_Buffer(the_geom::geography, ' + distance + ')::geometry the_geom,',
        skipColumns(columnNames).join(','),
        'FROM (' + inputQuery + ') _camshaft_buffer'
    ].join('\n');
}

var SKIP_COLUMNS = {
    'the_geom': true,
    'the_geom_webmercator': true
};

function skipColumns(columnNames) {
    return columnNames
        .filter(function(columnName) { return !SKIP_COLUMNS[columnName]; });
}