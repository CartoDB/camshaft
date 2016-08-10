'use strict';

var Node = require('../node');
var debug = require('../../util/debug')('analysis:line-this-layer-column');

var TYPE = 'line-this-layer-column';
var PARAMS = {
    source: Node.PARAM.NODE(Node.GEOMETRY.POINT),
    column_target: Node.PARAM.STRING()
};

var LineThisLayerColumn = Node.create(TYPE, PARAMS);

module.exports = LineThisLayerColumn;
module.exports.TYPE = TYPE;
module.exports.PARAMS = PARAMS;

LineThisLayerColumn.prototype.sql = function() {
    var sql = lineThisLayerColumn({
        source: this.source.getQuery(),
        columns: this.source.getColumns(true).map(function (column) {
            return '_cdb_analysis_source.' + column + ' as source_' + column;
        }).join(', '),
        column_target: this.column_target,
    });

    debug(sql);

    return sql;
};

var lineThisLayerColumn = Node.template([
    'SELECT',
    '  {{=it.columns}},',
    '  ST_MakeLine(',
    '    the_geom,',
    '    {{=it.column_target}}',
    '  ) AS the_geom',
    'FROM ({{=it.source}}) AS _cdb_analysis_source'
].join('\n'));
