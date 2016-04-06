'use strict';

var Node = require('../node');

var TYPE = 'buffer';
var PARAMS = {
    source: Node.PARAM.NODE(Node.GEOMETRY.POINT),
    radio: Node.PARAM.NUMBER
};
var OUTPUT = Node.GEOMETRY.POLYGON;

var Buffer = Node.create(TYPE, PARAMS, OUTPUT);

module.exports = Buffer;
module.exports.TYPE = TYPE;
module.exports.PARAMS = PARAMS;
module.exports.OUTPUT = OUTPUT;

Buffer.prototype.sql = function() {
    return [
        'SELECT ST_Buffer(the_geom::geography, ' + this.radio + ')::geometry the_geom,',
        this.source.getColumns(true).join(','),
        'FROM (' + this.source.getQuery() + ') _camshaft_buffer'
    ].join('\n');
};
