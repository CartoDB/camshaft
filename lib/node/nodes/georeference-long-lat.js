'use strict';

var Node = require('../node');
var dot = require('dot');

var TYPE = 'georeference-long-lat';

var PARAMS = {
    source : Node.PARAM.NODE(Node.GEOMETRY.ANY),
    longitude: Node.PARAM.STRING(),
    latitude: Node.PARAM.STRING(),
};

var GeoreferenceLongLat = Node.create(TYPE, PARAMS);

module.exports = GeoreferenceLongLat;
module.exports.TYPE = TYPE;
module.exports.PARAMS = PARAMS;

var georeferenceLongLatTemplate = dot.template([
    'SELECT',
    '  {{=it.columns}},',
    '  ST_SetSRID(' +
    '    ST_MakePoint(',
    '      {{=it.longitude}},',
    '      {{=it.latitude}}',
    '    ),',
    '    4326',
    '  ) AS the_geom',
    'FROM ({{=it.source}}) AS _camshaft_georeference_long_lat_analysis'
].join('\n'));

GeoreferenceLongLat.prototype.sql = function(){
    return georeferenceLongLatTemplate({
        source: this.source.getQuery(),
        columns: this.source.getColumns(true).join(', '),
        longitude: this.longitude,
        latitude: this.latitude
    });
};
