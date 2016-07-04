'use strict';

var Node = require('../node');

var TYPE = 'routing-to-single-point';
var PARAMS = {
    source: Node.PARAM.NODE(Node.GEOMETRY.POINT),
    mode: Node.PARAM.ENUM('car', 'walk', 'bicycle', 'public_transport'),
    destination_longitude: Node.PARAM.NUMBER(),
    destination_latitude: Node.PARAM.NUMBER(),
    units: Node.PARAM.NULLABLE(Node.PARAM.ENUM('kilometers', 'miles'), 'kilometers')
};

var RoutingToSinglePoint = Node.create(TYPE, PARAMS, { cache: true });

module.exports = RoutingToSinglePoint;
module.exports.TYPE = TYPE;
module.exports.PARAMS = PARAMS;

RoutingToSinglePoint.prototype.sql = function() {
    return routingToSinglePointQueryTemplate({
        source: this.source.getQuery(),
        columns: this.source.getColumns(true).join(', '),
        destination_longitude: this.destination_longitude,
        destination_latitude: this.destination_latitude,
        mode: this.mode,
        mode_type:'shortest',
        units: this.units
    });
};

var routingToSinglePointQueryTemplate = Node.template([
    'SELECT',
    '  (route).duration,',
    '  (route).length,',
    '  (route).the_geom,',
    '  {{=it.columns}}',
    'FROM (',
    '  SELECT',
    '    cdb_dataservices_client.cdb_route_point_to_point(',
    '      the_geom,',
    '      ST_SetSRID(',
    '        ST_MakePoint(',
    '          {{=it.destination_longitude}},',
    '          {{=it.destination_latitude}}',
    '        ),',
    '        4326',
    '      ),',
    '      \'{{=it.mode}}\',',
    '      ARRAY[\'mode_type={{=it.mode_type}}\']::text[],',
    '      \'{{=it.units}}\'',
    '    ) as route,',
    '    {{=it.columns}}',
    '  FROM ({{=it.source}}) _cdb_analysis_source_points',
    ') _cdb_analysis_routing'
].join('\n'));
