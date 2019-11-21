'use strict';

var Node = require('../node');
var debug = require('../../util/debug')('analysis:line-to-column');

var TYPE = 'line-to-column';
var PARAMS = {
    source: Node.PARAM.NODE(Node.GEOMETRY.POINT),
    target_column: Node.PARAM.STRING()
};

var LineToColumn = Node.create(TYPE, PARAMS);

module.exports = LineToColumn;

LineToColumn.prototype.sql = function() {
    var skipGeoms = true;
    var sql = linetoColumn({
        source: this.source.getQuery(),
        columns: this.source.getColumns(skipGeoms, [this.target_column]).join(', '),
        target_column: this.target_column
    });

    debug(sql);

    return sql;
};

var linetoColumn = Node.template([
    'SELECT',
    '  *,',
    '  ST_Length(the_geom::geography) / 1000 AS length',
    'FROM (',
    '  SELECT',
    '    {{=it.columns}},',
    '    ST_MakeLine(',
    '      the_geom,',
    '      {{=it.target_column}}',
    '    ) AS the_geom',
    '  FROM (',
    '    {{=it.source}}',
    '  ) _analysis_line',
    ') AS _cdb_analysis_source'
].join('\n'));
