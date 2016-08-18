'use strict';

var Node = require('../node');
var debug = require('../../util/debug')('analysis:line-to-single-point');

var TYPE = 'line-to-single-point';
var PARAMS = {
    source: Node.PARAM.NODE(Node.GEOMETRY.POINT),
    destination_longitude: Node.PARAM.NUMBER(),
    destination_latitude: Node.PARAM.NUMBER(),
};

var LineToSinglePoint = Node.create(TYPE, PARAMS);

module.exports = LineToSinglePoint;
module.exports.TYPE = TYPE;
module.exports.PARAMS = PARAMS;

LineToSinglePoint.prototype.sql = function() {
    var sql = lineToSinglePointQueryTemplate({
        source: this.source.getQuery(),
        columns: this.source.getColumns(true).join(', '),
        destination_longitude: this.destination_longitude,
        destination_latitude: this.destination_latitude
    });

    debug(sql);

    return sql;
};

var lineToSinglePointQueryTemplate = Node.template([
    'SELECT',
    '  ST_MakeLine(',
    '    the_geom,',
    '    ST_SetSRID(',
    '      ST_MakePoint(',
    '        {{=it.destination_longitude}},',
    '        {{=it.destination_latitude}}',
    '      ),',
    '      4326',
    '    )',
    '  ) AS the_geom,',
    '  {{=it.columns}}',
    'FROM ({{=it.source}}) _cdb_analysis_source_points',
].join('\n'));
