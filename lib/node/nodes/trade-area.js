'use strict';

var Node = require('../node');

var TYPE = 'trade-area';
var PARAMS = {
    source: Node.PARAM.NODE(Node.GEOMETRY.POINT),
    kind: Node.PARAM.ENUM('walk', 'drive', 'bike'),
    time: Node.PARAM.NUMBER
};

var TradeArea = Node.create(TYPE, PARAMS, { cache: true });

module.exports = TradeArea;
module.exports.TYPE = TYPE;
module.exports.PARAMS = PARAMS;

TradeArea.prototype.sql = function() {
    var distance = fakeTradeAreaDistanceFrom(this.kind, this.time);
    return [
        'SELECT ST_Buffer(the_geom::geography, ' + distance + ')::geometry the_geom,',
        this.source.getColumns(true).join(','),
        'FROM (' + this.source.getQuery() + ') _cdb_create_cache_table'
    ].join('\n');
};

var kmhMap = {
    walk: 5,
    bike: 15,
    drive: 90
};

function fakeTradeAreaDistanceFrom(kind, time) {
    kind = kmhMap.hasOwnProperty(kind) ? kind : 'walk';
    var kmh = kmhMap[kind];
    return (time / 3600) * (kmh * 1e3);
}
