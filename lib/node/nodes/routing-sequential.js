'use strict';

var Node = require('../node');

var TYPE = 'routing-sequential';
var PARAMS = {
    source: Node.PARAM.NODE(Node.GEOMETRY.POINT),
    mode: Node.PARAM.ENUM('car', 'walk', 'bicycle', 'public_transport'),
    target_column: Node.PARAM.STRING(),
    units: Node.PARAM.NULLABLE(Node.PARAM.ENUM('kilometers', 'miles'), 'kilometers'),
    order_column:  Node.PARAM.NULLABLE(Node.PARAM.STRING(), 'cartodb_id'),
    order_type: Node.PARAM.NULLABLE(Node.PARAM.ENUM('asc', 'desc'), 'asc')
};

var RoutingSequential = Node.create(TYPE, PARAMS, { cache: true });

module.exports = RoutingSequential;
module.exports.TYPE = TYPE;
module.exports.PARAMS = PARAMS;

RoutingSequential.prototype.sql = function() {
    return routingSequentialQueryTemplate({
        source: this.source.getQuery(),
        columns: this.source.getColumns(true).join(', '),
        target_column: this.target_column,
        mode: this.mode,
        mode_type: 'shortest',
        units: this.units,
        order_column:  this.order_column,
        order_type: this.order_type
    });
};

var routingSequentialQueryTemplate = Node.template([
    'SELECT',
    '  (route).duration,',
    '  (route).length,',
    '  (route).the_geom',
    'FROM (',
    '  SELECT',
    '    cdb_dataservices_client.cdb_route_with_waypoints(',
    '      array_agg({{=it.target_column}}),',
    '      \'{{=it.mode}}\',',
    '      ARRAY[\'mode_type={{=it.mode_type}}\']::text[],',
    '      \'{{=it.units}}\'',
    '    ) as route',
    '  FROM (',
    '    SELECT',
    '      *',
    '    FROM (',
    '     {{=it.source}}',
    '    ) _cdb_analysis_ordered_source_point',
    '    {{?it.order_column}} ORDER BY {{=it.order_column}} {{=it.order_type}} {{?}}',
    '  ) _cdb_analysis_routing_sequential',
    ') _cdb_analysis_routing'
].join('\n'));
