'use strict';

var Node = require('../node');

var TYPE = 'routing-waypoints';
var PARAMS = {
    source: Node.PARAM.NODE(Node.GEOMETRY.POINT),
    mode: Node.PARAM.ENUM('car', 'walk', 'bicycle', 'public_transport'),
    column_target: Node.PARAM.STRING(),
    units: Node.PARAM.NULLABLE(Node.PARAM.ENUM('kilometers', 'miles'), 'kilometers')
};

var RoutingWaypoints = Node.create(TYPE, PARAMS, { cache: true });

module.exports = RoutingWaypoints;
module.exports.TYPE = TYPE;
module.exports.PARAMS = PARAMS;

RoutingWaypoints.prototype.sql = function() {
    return routingWaypointsQueryTemplate({
        source: this.source.getQuery(),
        column_target: this.column_target,
        mode: this.mode,
        mode_type: 'shortest',
        units: this.units
    });
};

var routingWaypointsQueryTemplate = Node.template([
    'SELECT',
    '  (route).duration,',
    '  (route).length,',
    '  (route).the_geom',
    'FROM (',
    '  SELECT',
    '    cdb_route_with_waypoints(',
    '      array_agg({{=it.column_target}}),',
    '      \'{{=it.mode}}\',',
    '      ARRAY[\'mode_type={{=it.mode_type}}\']::text[],',
    '      \'{{=it.units}}\'',
    '    ) as route',
    '  FROM ( {{=it.source}} ) _cdb_analysis_routing_waypoints',
    ') _cdb_analysis_routing'
].join('\n'));
