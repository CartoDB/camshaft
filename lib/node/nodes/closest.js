'use strict';

var Node = require('../node');

var TYPE = 'closest';

var PARAMS = {
    source: Node.PARAM.NODE(Node.GEOMETRY.ANY),
    target: Node.PARAM.NODE(Node.GEOMETRY.ANY),
    responses: Node.PARAM.NULLABLE(Node.PARAM.NUMBER(), 1),
    category: Node.PARAM.NULLABLE(Node.PARAM.STRING())
};

var Closest = Node.create(TYPE, PARAMS, {cache: true, version: 1});

module.exports = Closest;

var closestTemplate = Node.template([
    'WITH',
    '    source as({{=it.squery}}),',
    '    target as({{=it.tquery}})',
    'SELECT',
    '    t.*,',
    '    source.cartodb_id as source_cartodb_id,',
    '    {{? it.responses > 1}} t.ranking as closest_rank,{{?}}',
    '    ST_Distance(geography(t.the_geom), geography(source.the_geom)) as closest_dist',
    'FROM source',
    'CROSS JOIN LATERAL (',
    '    SELECT * FROM (',
    '        SELECT *,',
    '            row_number() over(',
    '                {{? it.category !== null}}PARTITION BY {{=it.category}}{{?}}',
    '                ORDER BY source.the_geom <-> the_geom',
    '            ) AS ranking',
    '        FROM target',
    '    ) AS ranked',
    '    WHERE ranking <= {{=it.responses}}',
    ') AS t'
].join('\n'));

Closest.prototype.sql = function(){
    return closestTemplate({
        squery: this.source.getQuery(),
        tquery: this.target.getQuery(),
        responses: this.responses,
        category: this.category
    });
};
