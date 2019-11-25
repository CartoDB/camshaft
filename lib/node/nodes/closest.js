'use strict';

var Node = require('../node');
var limits = require('../limits');
var debug = require('../../util/debug')('analysis:closest');

var TYPE = 'closest';

var PARAMS = {
    source: Node.PARAM.NODE(Node.GEOMETRY.ANY),
    target: Node.PARAM.NODE(Node.GEOMETRY.ANY),
    responses: Node.PARAM.NULLABLE(Node.PARAM.NUMBER(), 1),
    category: Node.PARAM.NULLABLE(Node.PARAM.STRING())
};

var Closest = Node.create(TYPE, PARAMS, {cache: true, version: 2});

module.exports = Closest;

var closestTemplate = Node.template([
    'WITH',
    '    source as({{=it.squery}}),',
    '    target as({{=it.tquery}})',
    'SELECT',
    '    row_number() over() as cartodb_id,',
    '    {{=it.tcolumns}},',
    '    source.cartodb_id as source_cartodb_id,',
    '    t.cartodb_id as target_cartodb_id,',
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

Closest.prototype.sql = function () {
    var query = closestTemplate({
        squery: this.source.getQuery(),
        tquery: this.target.getQuery(),
        tcolumns: this.target.getColumns({ ignoreGeomColumns: false, ignoredExtraColumns:  ['cartodb_id'] })
                             .map(column => `t.${column}`).join(', '),
        responses: this.responses,
        category: this.category
    });

    debug(query);

    return query;
};

Closest.prototype.checkLimits = function(context, callback) {
    var maxNumberOfRows = 1000000;
    // To avoid passing th number of responses we divide the max number of
    // rows by the number of expected responses per row and then check by
    // rows * categories
    var limit = context.getLimit(
        this.getType(), 'maximumNumberOfRows', (maxNumberOfRows/this.responses),
        'this analysis would exceed the maximum number of results of ' + maxNumberOfRows
    );
    limits.limitInputRowsMultipliedByCategories(
        this,
        'source',
        {source: 'target', column: this.category},
        context,
        limit,
        callback
    );
};
