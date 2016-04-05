'use strict';

var TYPE = 'trade-area';
var debug = require('../../util/debug')(TYPE);

var Node = require('../node');
var PARAMS = {
    source: Node.PARAM.NODE,
    kind: Node.PARAM.ENUM('walk', 'drive', 'bike'),
    time: Node.PARAM.NUMBER
};

var TradeArea = Node.create(TYPE, PARAMS, { cache: true });

module.exports = TradeArea;
module.exports.TYPE = TYPE;
module.exports.PARAMS = PARAMS;

// ------------------------------ PUBLIC API ------------------------------ //

TradeArea.prototype._getQuery = function() {
    var distance = fakeTradeAreaDistanceFrom(this.kind, this.time);
    debug('For kind=%s, time=%d => distance=%d', this.kind, this.time, distance);
    return [
        'SELECT ST_Buffer(the_geom::geography, ' + distance + ')::geometry the_geom,',
        skipColumns(this.source.getColumns()).join(','),
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

var SKIP_COLUMNS = {
    'the_geom': true,
    'the_geom_webmercator': true
};

function skipColumns(columnNames) {
    return columnNames
        .filter(function(columnName) { return !SKIP_COLUMNS[columnName]; });
}
