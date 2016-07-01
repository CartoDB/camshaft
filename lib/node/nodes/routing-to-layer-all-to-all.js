'use strict';

var Node = require('../node');

var OURTER_ALIAS = '_cdb_analysis_routing';
var SOURCE_ALIAS = '_cdb_analysis_source';
var TARGET_ALIAS = '_cdb_analysis_target';

var TYPE = 'routing-to-layer-all-to-all';
var PARAMS = {
    source: Node.PARAM.NODE(Node.GEOMETRY.POINT),
    source_column: Node.PARAM.STRING(),
    target: Node.PARAM.NODE(Node.GEOMETRY.POINT),
    target_column: Node.PARAM.STRING(),
    mode: Node.PARAM.ENUM('car', 'walk', 'bicycle', 'public_transport'),
    units: Node.PARAM.NULLABLE(Node.PARAM.ENUM('kilometers', 'miles'), 'kilometers'),
    closest: Node.PARAM.BOOLEAN()
};

var RoutingToLayerAllToAll = Node.create(TYPE, PARAMS, { cache: true,
    beforeCreate: function (node) {
        if (node.closest) {
            node.ignoreParamForId('duration');
            node.filters.__duration__ = {
                type: 'grouped-rank',
                column: 'duration',
                params: {
                    group: node.source_column,
                    rank: 'bottom',
                    maxRank: 1
                }
            };
        }
    }
});

module.exports = RoutingToLayerAllToAll;
module.exports.TYPE = TYPE;
module.exports.PARAMS = PARAMS;

RoutingToLayerAllToAll.prototype.sql = function() {
    var routingToLayerQuery = routingToLayerQueryTemplate({
        source: this.source.getQuery(),
        source_alias: SOURCE_ALIAS,
        source_column: this.source_column,
        source_columns: this.source.getColumns(true).map(function (column) {
            return SOURCE_ALIAS + '.' + column;
        }).join(', '),
        final_columns: this.source.getColumns(true).map(function (column) {
            return OURTER_ALIAS + '.' + column;
        }).join(', '),
        final_alias: OURTER_ALIAS,
        target: this.target.getQuery(),
        target_column: this.target_column,
        target_alias: TARGET_ALIAS,
        mode: this.mode,
        mode_type: 'shortest',
        units: this.units
    });

    return routingToLayerQuery;
};

var routingToLayerQueryTemplate = Node.template([
    'SELECT',
    '  (route).duration,',
    '  (route).length,',
    '  (route).the_geom,',
    '  {{=it.final_columns}}',
    'FROM (',
    '  SELECT',
    '    cdb_route_point_to_point(',
    '      _cdb_analysis_source.the_geom,',
    '      _cdb_analysis_target.the_geom,',
    '      \'{{=it.mode}}\',',
    '      ARRAY[\'mode_type={{=it.mode_type}}\']::text[],',
    '      \'{{=it.units}}\'',
    '    ) as route,',
    '    {{=it.source_columns}}',
    '  FROM (',
    '    {{=it.source}}',
    '  ) {{=it.source_alias}}, (',
    '    {{=it.target}}',
    '  ) {{=it.target_alias}}',
    '  WHERE',
    '    {{=it.source_alias}}.{{=it.source_column}} = {{=it.target_alias}}.{{=it.target_column}}',
    ') {{=it.final_alias}}'
].join('\n'));
