'use strict';

var dot = require('dot');
dot.templateSettings.strip = false;

var Node = require('../node');

var TYPE = 'merge';
var PARAMS = {
    left_source: Node.PARAM.NODE(Node.GEOMETRY.ANY),
    right_source: Node.PARAM.NODE(Node.GEOMETRY.ANY),
    left_source_column: Node.PARAM.STRING(),
    right_source_column: Node.PARAM.STRING(),
    join_operator: Node.PARAM.NULLABLE(Node.PARAM.ENUM('inner', 'left', 'right'), 'inner'),
    source_geometry: Node.PARAM.NULLABLE(Node.PARAM.ENUM('left_source', 'right_source'), 'left_source'),
    left_source_columns: Node.PARAM.NULLABLE(Node.PARAM.ARRAY(Node.PARAM.STRING())),
    right_source_columns: Node.PARAM.NULLABLE(Node.PARAM.ARRAY(Node.PARAM.STRING()), [])
};

var Merge = Node.create(TYPE, PARAMS);

module.exports = Merge;
module.exports.TYPE = TYPE;
module.exports.PARAMS = PARAMS;

var INPUT_LEFT_ALIAS = '_cdb_analysis_left_source';
var INPUT_RIGHT_ALIAS = '_cdb_analysis_right_source';

var JOIN_OPERATIONS = {
    inner: 'INNER JOIN',
    left: 'LEFT JOIN',
    right: 'RIGHT JOIN'
};

Merge.prototype.sql = function() {
    var geomColumn = ((this.source_geometry === 'left_source') ? INPUT_LEFT_ALIAS : INPUT_RIGHT_ALIAS) +
        '.the_geom as the_geom';

    var leftColumns = (this.left_source_columns === null) ?
        this.left_source.getColumns(true) :
        this.left_source_columns;
    leftColumns = setAliasTo(leftColumns, INPUT_LEFT_ALIAS);
    var rightColumns = setAliasTo(this.right_source_columns, INPUT_RIGHT_ALIAS, 'right');
    var columns = [geomColumn].concat(leftColumns).concat(rightColumns);

    return queryTemplate({
        columns: columns.join(', '),
        input_left_alias: INPUT_LEFT_ALIAS,
        input_right_alias: INPUT_RIGHT_ALIAS,
        input_left: this.left_source.getQuery(),
        join_operation: JOIN_OPERATIONS[this.join_operator],
        input_right: this.right_source.getQuery(),
        input_left_column_join_on: INPUT_LEFT_ALIAS + '.' + this.left_source_column,
        input_right_column_join_on: INPUT_RIGHT_ALIAS + '.' + this.right_source_column
    });
};

var queryTemplate = dot.template([
    'SELECT {{=it.columns}}',
    'FROM',
    '  ({{=it.input_left}}) AS {{=it.input_left_alias}}',
    '  {{=it.join_operation}}',
    '  ({{=it.input_right}}) AS {{=it.input_right_alias}}',
    'ON {{=it.input_left_column_join_on}} = {{=it.input_right_column_join_on}}'
].join('\n'));

function setAliasTo(columns, alias, as) {
    return columns.map(function (column) {
        var qualifiedColumnName = alias + '.' + column;
        if (as) {
            qualifiedColumnName += ' as ' + as + '_' + column;
        }
        return qualifiedColumnName;
    });
}
