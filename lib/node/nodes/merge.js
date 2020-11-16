'use strict';

var dot = require('dot');
dot.templateSettings.strip = false;

var debug = require('../../util/debug')('analysis:merge');
var utilId = require('../../util/id');
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

var JOIN_OPERATIONS = {
    inner: 'INNER JOIN',
    left: 'LEFT JOIN',
    right: 'RIGHT JOIN'
};

Merge.prototype.sql = function () {
    var buster = utilId.buster();

    var leftAlias = '_cdb_analysis_left_source' + buster;
    var rightAlias = '_cdb_analysis_right_source' + buster;

    var columns = this._getColumns(leftAlias, rightAlias);

    var sql = queryTemplate({
        columns: columns.join(', '),
        input_left_alias: leftAlias,
        input_right_alias: rightAlias,
        input_left: this.left_source.getQuery(),
        join_operation: JOIN_OPERATIONS[this.join_operator],
        input_right: this.right_source.getQuery(),
        input_left_column_join_on: `${leftAlias}."${this.left_source_column}"`,
        input_right_column_join_on: `${rightAlias}."${this.right_source_column}"`
    });

    debug(sql);

    return sql;
};

Merge.prototype._getColumns = function (leftAlias, rightAlias) {
    var geomColumn = ((this.source_geometry === 'left_source') ? leftAlias : rightAlias) +
        '.the_geom as the_geom';

    var columns = [geomColumn]
        .concat(this._getLeftColumns(leftAlias))
        .concat(this._getRightColumns(rightAlias));

    return columns;
};

function isNotAGeometryColumn (column) {
    return !(column.endsWith('the_geom'));
}

Merge.prototype._getLeftColumns = function (leftAlias) {
    var leftColumns = (this.left_source_columns === null)
        ? this.left_source.getColumns({ ignoreGeomColumns: true })
        : this.left_source_columns;

    if (this.source_geometry === 'left_source') {
        leftColumns = leftColumns.filter(isNotAGeometryColumn);
    }

    leftColumns = setAliasTo(leftColumns, leftAlias, 'left');
    return leftColumns;
};

Merge.prototype._getRightColumns = function (rightAlias) {
    var rightColumns = this.right_source_columns;

    if (this.source_geometry === 'right_source') {
        rightColumns = rightColumns.filter(isNotAGeometryColumn);
    }

    rightColumns = setAliasTo(rightColumns, rightAlias, 'right');

    return rightColumns;
};

var queryTemplate = dot.template([
    'SELECT ',
    '  row_number() over() as cartodb_id,',
    '  {{=it.columns}}',
    'FROM',
    '  ({{=it.input_left}}) AS {{=it.input_left_alias}}',
    '  {{=it.join_operation}}',
    '  ({{=it.input_right}}) AS {{=it.input_right_alias}}',
    'ON {{=it.input_left_column_join_on}} = {{=it.input_right_column_join_on}}'
].join('\n'));

function setAliasTo (columns, alias, as) {
    return columns.map(function (column) {
        var qualifiedColumnName = alias + '.' + column;

        if (as === 'left') {
            // only set alias to cartodb_id column
            if (column.endsWith('cartodb_id"') || column.endsWith('cartodb_id')) {
                qualifiedColumnName += ' as ' + column.replace('cartodb_id', '_cartodb_id');
            }
        } else if (as) {
            qualifiedColumnName += ' as ' + as + '_' + column;
        }

        return qualifiedColumnName;
    });
}
