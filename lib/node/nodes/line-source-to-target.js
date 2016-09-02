'use strict';

var Node = require('../node');
var debug = require('../../util/debug')('analysis:line-source-to-target');

var OURTER_ALIAS = '_cdb_analysis_lines';
var SOURCE_ALIAS = '_cdb_analysis_source';
var TARGET_ALIAS = '_cdb_analysis_target';

var TYPE = 'line-source-to-target';
var PARAMS = {
    source: Node.PARAM.NODE(Node.GEOMETRY.POINT),
    source_column: Node.PARAM.NULLABLE(Node.PARAM.STRING()),
    target: Node.PARAM.NODE(Node.GEOMETRY.POINT),
    target_column: Node.PARAM.NULLABLE(Node.PARAM.STRING())
};

var LineSourceToTarget = Node.create(TYPE, PARAMS, {
    version: 1,
    beforeCreate: function (node) {
        if (!node.source_column && node.target_column) {
            throw new Error('Missing param `source_column`');
        }

        if (node.source_column && !node.target_column) {
            throw new Error('Missing param `target_column`');
        }
    }
});

module.exports = LineSourceToTarget;
module.exports.TYPE = TYPE;
module.exports.PARAMS = PARAMS;

LineSourceToTarget.prototype.sql = function() {
    var skipGeoms = true;
    var sql = lineToLayerQueryTemplate({
        source: this.source.getQuery(),
        source_alias: SOURCE_ALIAS,
        source_column: this.source_column,
        source_columns: this.source.getColumns(skipGeoms).map(function (column) {
            return SOURCE_ALIAS + '.' + column;
        }).join(', '),
        final_columns: this.source.getColumns(skipGeoms).map(function (column) {
            return OURTER_ALIAS + '.' + column;
        }).join(', '),
        final_alias: OURTER_ALIAS,
        target: this.target.getQuery(),
        target_column: this.target_column,
        target_alias: TARGET_ALIAS
    });

    debug(sql);

    return sql;
};

var lineToLayerQueryTemplate = Node.template([
    'SELECT',
    '  ST_Length(the_geom) as length,',
    '  the_geom,',
    '  {{=it.final_columns}}',
    'FROM (',
    '  SELECT',
    '    ST_MakeLine(',
    '      {{=it.source_alias}}.the_geom,',
    '      {{=it.target_alias}}.the_geom',
    '    ) AS the_geom,',
    '    {{=it.source_columns}}',
    '  FROM (',
    '    {{=it.source}}',
    '  ) {{=it.source_alias}}, (',
    '    {{=it.target}}',
    '  ) {{=it.target_alias}}',
    '  {{? it.source_column && it.target_column}}',
    '  WHERE',
    '    {{=it.source_alias}}.{{=it.source_column}} = {{=it.target_alias}}.{{=it.target_column}}',
    '  {{?}}',
    ') {{=it.final_alias}}'
].join('\n'));
