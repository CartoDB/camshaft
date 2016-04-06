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

Buffer.prototype.sql = function() {
    return [
        'SELECT ST_Buffer(the_geom::geography, ' + this.radio + ')::geometry the_geom,',
        this.source.getColumns(true).join(','),
        'FROM (' + this.source.getQuery() + ') _camshaft_buffer'
    ].join('\n');
};
