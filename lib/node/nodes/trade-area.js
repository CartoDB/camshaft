'use strict';

var dot = require('dot');
dot.templateSettings.strip = false;

var Node = require('../node');

var TYPE = 'trade-area';
var PARAMS = {
    source: Node.PARAM.NODE,
    kind: Node.PARAM.ENUM('walk', 'car'),
    time: Node.PARAM.NUMBER
};

var TradeArea = Node.create(TYPE, PARAMS, { cache: true });

module.exports = TradeArea;
module.exports.TYPE = TYPE;
module.exports.PARAMS = PARAMS;

TradeArea.prototype.sql = function() {
    return query({
        point_source: this.point_source,
        kind: this.kind,
        time: this.time
    });
};

function query(it) {
    return queryTemplate(it);
}

var queryTemplate = dot.template([
    'SELECT',
    ' *',
    'FROM',
    ' cdb_isochrone(',
    '  {{=it.point_source}}',
    '  {{=it.kind}}',
    '  ARRAY[{{=it.isolines}}]::integer[]',
    ')'
].join('\n'));
