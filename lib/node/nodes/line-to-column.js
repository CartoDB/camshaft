'use strict';

var Node = require('../node');
var debug = require('../../util/debug')('analysis:line-to-column');

var TYPE = 'line-to-column';
var PARAMS = {
    source: Node.PARAM.NODE(Node.GEOMETRY.POINT),
    column_target: Node.PARAM.STRING()
};

var LineToColumn = Node.create(TYPE, PARAMS);

module.exports = LineToColumn;
module.exports.TYPE = TYPE;
module.exports.PARAMS = PARAMS;

LineToColumn.prototype.sql = function() {
    var self = this;
    var skipGeoms = true;
    var sql = linetoColumn({
        source: this.source.getQuery(),
        columns: this.source.getColumns(skipGeoms).filter(function (column) {
            return self.column_target !== column;
        }).join(', '),
        column_target: this.column_target,
    });

    debug(sql);

    return sql;
};

var linetoColumn = Node.template([
    'SELECT',
    '  {{=it.columns}},',
    '  ST_MakeLine(',
    '    the_geom,',
    '    {{=it.column_target}}',
    '  ) AS the_geom',
    'FROM ({{=it.source}}) AS _cdb_analysis_source'
].join('\n'));
