'use strict';

var Node = require('../node');

var TYPE = 'gravity';

var PARAMS = {
    source: Node.PARAM.NODE(Node.GEOMETRY.ANY), // "populated places"
    target: Node.PARAM.NODE(Node.GEOMETRY.POINT), // "malls"
    weight_column: Node.PARAM.STRING(),
    weight_threshold: Node.PARAM.NULLABLE(Node.PARAM.NUMBER(),-10e307),
    pop_column: Node.PARAM.STRING(),
    max_distance: Node.PARAM.NUMBER(), // meters
    target_id: Node.PARAM.NUMBER() // the "mall" to be studied
};

var Gravity = Node.create(TYPE, PARAMS, {cache: true, version: 1});

module.exports = Gravity;
module.exports.TYPE = TYPE;
module.exports.PARAMS = PARAMS;

var gravityTemplate = Node.template([
    'WITH ',
    ' raw_s as({{=it.sourceQuery}}),',
    ' raw_t as({{=it.targetQuery}}),',
    ' s as(',
        'SELECT',
        ' array_agg(cartodb_id::bigint) as id,',
        ' array_agg(the_geom) as g,',
        ' array_agg(coalesce({{=it.p}},0)::numeric) as p',
        ' FROM raw_s',
    '),',
    ' t as(',
        'SELECT',
        ' array_agg(cartodb_id::bigint) as id,',
        ' array_agg(the_geom) as g,',
        ' array_agg(coalesce({{=it.w}},0)::numeric) as w',
        ' FROM raw_t',
    ')',
    'SELECT ',
    ' g.source_id as cartodb_id,',
    ' g.the_geom,',
    ' ST_transform(g.the_geom, 3857) as the_geom_webmercator,',
    ' g.h as patronage_prob,',
    ' g.hpop patronaging_pop,',
    ' g.dist as dist_to_target ',
    'FROM ',
    ' t,',
    ' s,',
    ' cdb_crankshaft.CDB_Gravity(t.id, t.g, t.w, s.id, s.g, s.p,',
    '  {{=it.targetID}}::bigint, {{=it.r}}::integer, {{=it.wt}}::numeric) g'
].join('\n'));


Gravity.prototype.sql = function(){
    return gravityTemplate({
        sourceQuery: this.source.getQuery(),
        targetQuery: this.target.getQuery(),
        targetID: this.target_id,
        w: this.weight_column,
        wt: this.weight_threshold,
        p: this.pop_column,
        r: this.max_distance
    });
};
