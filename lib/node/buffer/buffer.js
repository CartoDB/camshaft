'use strict';

var Node = require('../node');

var TYPE = 'buffer';

var Buffer = Node.create(TYPE, {
    source: Node.PARAM_TYPE.NODE,
    radio: Node.PARAM_TYPE.NUMERIC
});

module.exports = Buffer;
module.exports.TYPE = TYPE;
module.exports.create = require('./factory').create;

// ------------------------------ PUBLIC API ------------------------------ //

Buffer.prototype.getQuery = function() {
    return bufferQuery(this.source.getQuery(), this.columns, this.radio);
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
