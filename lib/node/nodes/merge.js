'use strict';

var dot = require('dot');
dot.templateSettings.strip = false;

var debug = require('../../util/debug')('analysis:merge');

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

var Merge = Node.create(TYPE, PARAMS, { cache: true, version: 1 });

module.exports = Merge;

var INPUT_LEFT_ALIAS = '_cdb_analysis_left_source';
var INPUT_RIGHT_ALIAS = '_cdb_analysis_right_source';

var JOIN_OPERATIONS = {
    inner: 'INNER JOIN',
    left: 'LEFT JOIN',
    right: 'RIGHT JOIN'
};

Merge.prototype.sql = function() {
    var columns = this._getColumns();

    var sql = queryTemplate({
        columns: columns.join(', '),
        input_left_alias: INPUT_LEFT_ALIAS,
        input_right_alias: INPUT_RIGHT_ALIAS,
        input_left: this.left_source.getQuery(),
        join_operation: JOIN_OPERATIONS[this.join_operator],
        input_right: this.right_source.getQuery(),
        input_left_column_join_on: INPUT_LEFT_ALIAS + '.' + this.left_source_column,
        input_right_column_join_on: INPUT_RIGHT_ALIAS + '.' + this.right_source_column
    });

    debug(sql);

    return sql;
};

Merge.prototype._getColumns = function() {
    var geomColumn = ((this.source_geometry === 'left_source') ? INPUT_LEFT_ALIAS : INPUT_RIGHT_ALIAS) +
        '.the_geom as the_geom';
    var cartodbIdColumn = ((this.source_geometry === 'left_source') ? INPUT_LEFT_ALIAS : INPUT_RIGHT_ALIAS) +
        '.cartodb_id as cartodb_id';

    var columns = [cartodbIdColumn, geomColumn]
        .concat(this._getLeftColumns())
        .concat(this._getRightColumns());

    return columns;
};

Merge.prototype._getLeftColumns = function() {
    var leftColumns = (this.left_source_columns === null) ?
        this.left_source.getColumns(true) :
        this.left_source_columns;

    if (this.source_geometry === 'left_source') {
        leftColumns = skipCartoDBId(leftColumns);
    }

    leftColumns = setAliasTo(leftColumns, INPUT_LEFT_ALIAS, 'left');

    return leftColumns;
};

Merge.prototype._getRightColumns = function () {
    var rightColumns = this.right_source_columns;

    if (this.source_geometry === 'right_source') {
        rightColumns = skipCartoDBId(rightColumns);
    }

    rightColumns = setAliasTo(rightColumns, INPUT_RIGHT_ALIAS, 'right');

    return rightColumns;
};

var queryTemplate = dot.template([
    'SELECT {{=it.columns}}',
    'FROM',
    '  ({{=it.input_left}}) AS {{=it.input_left_alias}}',
    '  {{=it.join_operation}}',
    '  ({{=it.input_right}}) AS {{=it.input_right_alias}}',
    'ON {{=it.input_left_column_join_on}} = {{=it.input_right_column_join_on}}'
].join('\n'));

function skipCartoDBId(columns) {
    return columns.filter(function (column) {
        return column !== 'cartodb_id';
    });
}

function setAliasTo(columns, alias, as) {
    return columns.map(function (column) {
        var qualifiedColumnName = alias + '.' + column;

        if (as === 'left') {
            // only set alias to cartodb_id column
            if (column === 'cartodb_id') {
                qualifiedColumnName += ' as ' + as + '_' + column;
            }
        } else if (as) {
            qualifiedColumnName += ' as ' + as + '_' + column;
        }

        return qualifiedColumnName;
    });
}
