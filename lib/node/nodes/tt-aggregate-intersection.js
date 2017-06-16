'use strict';

var Node = require('../node');
var Source = require('../nodes/source');

var TYPE = 'tt-aggregate-intersection';
var PARAMS = {
    points_source: Node.PARAM.NODE(Node.GEOMETRY.POINT),
    polygons_target: Node.PARAM.NODE(Node.GEOMETRY.POLYGON),
    aggregate_function: Node.PARAM.ENUM('avg', 'count', 'max', 'min', 'sum'),
    aggregate_column: Node.PARAM.NULLABLE(Node.PARAM.STRING())
};

var TTAggregateIntersection = Node.create(TYPE, PARAMS, {
    cache: true,
    version: 4,
    beforeCreate: function(node) {
        if (node.points_source.getType() !== Source.TYPE || node.polygons_target.getType() !== Source.TYPE) {
            throw new Error('Params `points_source` and `polygons_target` must be Nodes with `type=source`');
        }
        if (node.polygons_target.getAffectedTables().length !== 1) {
            throw new Error('Param `polygons_target` should have a known table');
        }
    }
});

module.exports = TTAggregateIntersection;

var TT_NAME_REGEX = /tt_([^(\s|\.)]*)$/i;
TTAggregateIntersection.prototype.getTTName = function() {
    var query = this.points_source.getQuery(false);
    var matches = query && query.match(TT_NAME_REGEX);
    return matches && matches[1];
};

var ttIntersectionTemplate = Node.template([
    'SELECT _polygons.*, _tt_intersection.agg_value AS {{=it.final_column_name}}',
    'FROM TT_Intersection(',
    '    \'{{=it.points_table}}\',',
    '    \'{{=it.polygons_table}}\',',
    '    NULL::json,',
    '    ARRAY[{{=it.filters}}]::json[],',
    '    ARRAY[\'{"type":"numeric","aggregate_function":"{{=it.aggregate_function}}","aggregate_column":"{{=it.aggregate_column}}"}\']::json[]',
    ') AS _tt_intersection (',
    '    agg_value numeric,',
    '    cartodb_id int',
    '),',
    '(SELECT * FROM {{=it.polygons_table}}) _polygons',
    'WHERE _polygons.cartodb_id = _tt_intersection.cartodb_id',
].join('\n'));

TTAggregateIntersection.prototype.sql = function() {
    var pointsFilters = this.points_source.getFilters();
    var schema = this.points_source.schema || {};
    var filters = Object.keys(pointsFilters)
        .map(function(k) { return pointsFilters[k]; })
        .map(function(filter) {
            return Object.keys(filter.params).reduce(function(_filter, k) {
                _filter[k] = filter.params[k];
                return _filter;
            }, {
                type: filter.type,
                column: filter.column,
                column_type: schema.hasOwnProperty(filter.column) ? schema[filter.column] : null
            });
        });

    return ttIntersectionTemplate({
        points_table: this.getTTName(),
        polygons_table: this.polygons_target.getAffectedTables()[0],
        filters: filters.map(pgJson).join(','),
        aggregate_function: this.aggregate_function,
        aggregate_column: this.aggregate_column,
        final_column_name: this.aggregate_function === 'count' ?
            'count_vals' :
            this.aggregate_function + '_' + this.aggregate_column
    });
};

function pgJson(obj) {
    return '\'' + JSON.stringify(obj) + '\'';
}
