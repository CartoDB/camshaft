'use strict';

var dot = require('dot');
dot.templateSettings.strip = false;

var debug = require('../../util/debug')('analysis:merge');
var util_id = require('../../util/id');
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

Merge.prototype.sql = function() {
    var buster = util_id.buster();

    var left_alias = '_cdb_analysis_left_source' + buster;
    var right_alias = '_cdb_analysis_right_source' + buster;

    var columns = this._getColumns(left_alias, right_alias);

    var sql = queryTemplate({
        columns: columns.join(', '),
        input_left_alias: left_alias,
        input_right_alias: right_alias,
        input_left: this.left_source.getQuery(),
        join_operation: JOIN_OPERATIONS[this.join_operator],
        input_right: this.right_source.getQuery(),
        input_left_column_join_on: left_alias + '.' + this.left_source_column,
        input_right_column_join_on: right_alias + '.' + this.right_source_column
    });

    debug(sql);

    return sql;
};

Merge.prototype._getColumns = function(left_alias, right_alias) {
    var geomColumn = ((this.source_geometry === 'left_source') ? left_alias : right_alias) +
        '.the_geom as the_geom';

    var columns = [geomColumn]
        .concat(this._getLeftColumns(left_alias))
        .concat(this._getRightColumns(right_alias));

    return columns;
};

Merge.prototype._getLeftColumns = function(left_alias) {
    var leftColumns = (this.left_source_columns === null) ?
        this.left_source.getColumns(true) :
        this.left_source_columns;

    if (this.source_geometry === 'left_source') {
        leftColumns = leftColumns.filter(function (column) {
            return (/^.*the_geom$/.test(column) === false);
        });
    }

    leftColumns = setAliasTo(leftColumns, left_alias, 'left');
    return leftColumns;
};

Merge.prototype._getRightColumns = function (right_alias) {
    var rightColumns = this.right_source_columns;

    if (this.source_geometry === 'right_source') {
        rightColumns = rightColumns.filter(function (column) {
            return (/^.*the_geom$/.test(column) === false);
        });
    }

    rightColumns = setAliasTo(rightColumns, right_alias, 'right');

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

function setAliasTo(columns, alias, as) {
    return columns.map(function (column) {
        var qualifiedColumnName = alias + '.' + column;

        if (as === 'left') {
            // only set alias to cartodb_id column
            if (/^.*cartodb_id$/.test(column)) {
                qualifiedColumnName += ' as ' + as + '_' + column;
            }
        } else if (as) {
            qualifiedColumnName += ' as ' + as + '_' + column;
        }

        return qualifiedColumnName;
    });
}
