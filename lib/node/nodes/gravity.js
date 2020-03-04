'use strict';

var Node = require('../node');

var TYPE = 'gravity';

var PARAMS = {
    source: Node.PARAM.NODE(Node.GEOMETRY.ANY), // "populated places"
    target: Node.PARAM.NODE(Node.GEOMETRY.ANY), // "malls"
    weight_column: Node.PARAM.STRING(),
    weight_threshold: Node.PARAM.NULLABLE(Node.PARAM.NUMBER(), -10e307),
    pop_column: Node.PARAM.STRING(),
    max_distance: Node.PARAM.NUMBER(), // meters
    target_id: Node.PARAM.NUMBER() // the "mall" to be studied
};

var Gravity = Node.create(TYPE, PARAMS, {
    cache: true,
    version: 1,
    beforeCreate: function () {
        if (this.weight_threshold < -10e307) {
            throw new Error('weight_threshold param should be bigger than -10e307');
        }
        if (this.weight_threshold > 10e307) {
            throw new Error('weight_threshold param should be bigger than 10e307');
        }
    }
});

module.exports = Gravity;

var gravityTemplate = Node.template([
    'WITH ',
    ' raw_s as({{=it.sourceQuery}}),',
    ' raw_t as({{=it.targetQuery}}),',
    ' s as(',
    'SELECT',
    ' array_agg(cartodb_id::bigint) as id,',
    ' array_agg(the_geom) as geo,',
    ' array_agg(coalesce({{=it.pop_column}},0)::numeric) as pop',
    ' FROM raw_s',
    '),',
    ' t as(',
    'SELECT',
    ' array_agg(cartodb_id::bigint) as id,',
    ' array_agg(the_geom) as geo,',
    ' array_agg(coalesce({{=it.weight_column}},0)::numeric) as weight',
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
    ' cdb_crankshaft.CDB_Gravity(t.id, t.geo, t.weight, s.id, s.geo, s.pop,',
    '  {{=it.targetID}}::bigint, {{=it.max_distance}}::integer, {{=it.weight_threshold}}::numeric) g'
].join('\n'));

Gravity.prototype.sql = function () {
    return gravityTemplate({
        sourceQuery: this.source.getQuery(),
        targetQuery: this.target.getQuery(),
        targetID: this.target_id,
        weight_column: this.weight_column,
        weight_threshold: this.weight_threshold,
        pop_column: this.pop_column,
        max_distance: this.max_distance
    });
};
