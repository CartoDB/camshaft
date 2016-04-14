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
    var _columns = [
        'ST_Buffer(the_geom::geography, ' + this.radio + ')::geometry the_geom'
    ].concat(this.source.getColumns(true));
    return [
        'SELECT',
        _columns.join(','),
        'FROM (' + this.source.getQuery() + ') _camshaft_buffer'
    ].join('\n');
};
