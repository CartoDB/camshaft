'use strict';

var Node = require('../node');

var TYPE = 'closest';

var PARAMS = {
    source: Node.PARAM.NODE(Node.GEOMETRY.ANY),
    target: Node.PARAM.NODE(Node.GEOMETRY.ANY),
    responses: Node.PARAM.NULLABLE(Node.PARAM.NUMBER(), 1)
};

var Closest = Node.create(TYPE, PARAMS, {cache: true, version: 1});

module.exports = Closest;

var closestTemplate = Node.template([
    'WITH',
    ' source as({{=it.squery}}),',
    ' target as({{=it.tquery}})',
    'SELECT',
    ' s.*,',
    ' t.cartodb_id as closest_id,',
    ' ST_Distance(geography(t.the_geom),',
    ' geography(s.the_geom)) as closest_dist',
    'FROM',
    '(',
        'SELECT DISTINCT ON (the_geom) *',
        ' FROM source',
    ') AS s',
    'CROSS JOIN LATERAL',
    '(',
        'SELECT cartodb_id, the_geom',
        ' FROM target',
        ' ORDER BY s.the_geom <-> the_geom',
        ' LIMIT {{=it.responses}}'
    ') AS t'
].join('\n');

Closest.prototype.sql = function(){
    return closestTemplate({
        squery: this.source.getQuery(),
        tquery: this.target.getQuery(),
        responses: this.responses
    });
};
