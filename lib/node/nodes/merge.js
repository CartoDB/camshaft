'use strict';

var dot = require('dot');
dot.templateSettings.strip = false;

var Node = require('../node');

var INPUT_LEFT_ALIAS = '_cdb_analysis_input_left';
var INPUT_RIGHT_ALIAS = '_cdb_analysis_input_right';
var TYPE = 'merge';
var PARAMS = {
    input_left: Node.PARAM.NODE(Node.GEOMETRY.ANY),
    input_left_column_on: Node.PARAM.STRING,
    input_left_columns: Node.PARAM.ARRAY(),
    input_right: Node.PARAM.NODE(Node.GEOMETRY.ANY),
    input_right_column_on: Node.PARAM.STRING,
    input_right_columns: Node.PARAM.ARRAY(),
    join_type: Node.PARAM.ENUM('left', 'inner'),
};

var Merge = Node.create(TYPE, PARAMS, { cache: true });

module.exports = Merge;
module.exports.TYPE = TYPE;
module.exports.PARAMS = PARAMS;

Merge.prototype.sql = function() {
    var leftColumns = setAliasTo(this.input_left_columns, INPUT_LEFT_ALIAS);
    var rightColumns = setAliasTo(this.input_right_columns, INPUT_RIGHT_ALIAS);
    var columns = leftColumns.concat(rightColumns);

    return query({
        input_left_alias: INPUT_RIGHT_ALIAS,
        input_right_alias: INPUT_LEFT_ALIAS,
        input_left: this.input_left.getQuery(),
        input_left_column_on: INPUT_LEFT_ALIAS + '.' + this.input_left_column_on,
        input_right: this.input_right.getQuery(),
        input_right_column_on: INPUT_RIGHT_ALIAS + '.' + this.input_right_column_on,
        columns: columns.join(', '),
        left_join: (this.join_type === 'left')
    });
};

var queryTemplate = dot.template([
    'WITH',
    '{{=it.input_left_alias}} AS (',
    ' {{=it.input_left}}',
    '),',
    '{{=it.input_right_alias}} AS (',
    ' {{=it.input_right}}',
    ')',
    'SELECT ' +
    '  {{=it.columns}},',
    '  ST_Union({{=it.input_left_alias}}.the_geom, {{=it.input_right_alias}}.the_geom) AS the_geom',
    'FROM {{=it.input_left_alias}} {{?it.left_join}}LEFT{{?}} JOIN {{=it.input_right_alias}}',
    'ON {{=it.input_left_column_on}} = {{=it.input_right_column_on}}',
    'AND ST_Intersects({{=it.input_left_alias}}.the_geom, {{=it.input_right_alias}}.the_geom)'
].join('\n'));

function query(it) {
    console.log('>>>>>>>>>', queryTemplate(it));
    return queryTemplate(it);
}

function setAliasTo(columns, alias) {
    return columns.map(function (column) {
        return alias + '.' + column;
    });
}
