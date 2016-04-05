'use strict';

var Node = require('../node');

var TYPE = 'buffer';
var PARAMS = {
    source: Node.PARAM.NODE,
    radio: Node.PARAM.NUMBER
};

var Buffer = Node.create(TYPE, PARAMS);

module.exports = Buffer;
module.exports.TYPE = TYPE;
module.exports.PARAMS = PARAMS;

// ------------------------------ PUBLIC API ------------------------------ //

Buffer.prototype._getQuery = function() {
    return bufferQuery(this.source.getQuery(), this.source.getColumns(true), this.radio);
};

// ---------------------------- END PUBLIC API ---------------------------- //

function bufferQuery(inputQuery, columnNames, distance) {
    return [
        'SELECT ST_Buffer(the_geom::geography, ' + distance + ')::geometry the_geom,',
        columnNames.join(','),
        'FROM (' + inputQuery + ') _camshaft_buffer'
    ].join('\n');
}
