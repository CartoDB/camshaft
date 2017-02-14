'use strict';

var Node = require('../node');

var TYPE = 'closest';

var PARAMS = {
    source: Node.PARAM.NODE(Node.GEOMETRY.ANY),
    target: Node.PARAM.NODE(Node.GEOMETRY.ANY),
    responses: Node.PARAM.NULLABLE(Node.PARAM.NUMBER(), 1),
    category: Node.PARAM.NULLABLE(Node.PARAM.STRING(), '')
};

var Closest = Node.create(TYPE, PARAMS, {cache: true, version: 1});

module.exports = Closest;

Closest.prototype.sql = function(){
    var options = {
        squery: this.source.getQuery(),
        tquery: this.target.getQuery(),
        responses: this.responses,
        category: this.category
    };

    var closestTemplate = Node.template([
        'WITH',
        ' source as({{=it.squery}}),',
        ' target as({{=it.tquery}})',
        'SELECT',
        ' s.*,',
        ' t.cartodb_id as closest_id,',
        (options.category !== '')? ' t.category,' : '',
        (options.responses > 1)? ' t.ranking as closest_rank,' : '',
        ' ST_Distance(geography(t.the_geom),',
        ' geography(s.the_geom)) as closest_dist',
        'FROM',
        '(',
            'SELECT *',
            ' FROM source',
        ') AS s',
        'CROSS JOIN LATERAL',
        '(',
            'SELECT * FROM',
            '(SELECT cartodb_id, the_geom',
            (options.category !== '')? ', category' : '',
            ', row_number() over(' + ((options.category !== '')? 'PARTITION BY {{=it.category}}' : '') + ' ORDER BY s.the_geom <-> the_geom) as ranking',
            ' FROM target)  ranked',
            ' WHERE ranking <= {{=it.responses}}',
        ') AS t'
    ].join('\n'));

    return closestTemplate(options);

};
