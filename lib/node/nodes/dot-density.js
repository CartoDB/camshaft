'use strict';

var dot = require('dot');
dot.templateSettings.strip = false;

var Node = require('../node');

var TYPE = 'dot_density';
var PARAMS = {
    source: Node.PARAM.NODE(Node.GEOMETRY.POLYGON),
    points_col_name: Node.PARAM.NULLABLE(Node.PARAM.STRING),
    category_col_name: Node.PARAM.NULLABLE(Node.PARAM.STRING),
    points: Node.PARAM.NULLABLE(Node.PARAM.NUMBER)
};

var DotDensity = Node.create(TYPE, PARAMS);

module.exports = DotDensity; 
module.exports.TYPE = TYPE;
module.exports.PARAMS = PARAMS;

DotDensity.prototype.sql = function() {
    return query({
        query: this.source.getQuery(),
        points: this.points,
	points_col_name: this.points_col_name,
	category_col_name: this.category_col_name
    });
};

var queryTemplate = dot.template([
    'WITH',
    '_polygons AS (',
    ' {{=it.query}}',
    ')',
    'SELECT cdb_crankshaft.cdb_dot_density(_polygons.the_geom, {{=it.points_exp}}::INT) as the_geom',
    '{{? it.category_col_name}} , {{=it.category_col_name}}  as category{{?}}',
    'FROM _polygons'].join('\n')
);

function query(it) {
    it.points_exp = it.points_col_name ? it.points_col_name : it.points;
    return queryTemplate(it);
 }
