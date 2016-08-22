'use strict';

var Node = require('../node');
var debug = require('../../util/debug')('analysis:voronoi');


var TYPE = 'voronoi';
var PARAMS = {
    source: Node.PARAM.NODE(Node.GEOMETRY.POINT),
    buffer: Node.PARAM.NULLABLE(Node.PARAM.NUMBER(), 0.5),
    tolerance: Node.PARAM.NULLABLE(Node.PARAM.NUMBER(), 1e-9),
};

var Voronoi = Node.create(TYPE, PARAMS, { cache: true, version: 1 });

module.exports = Voronoi;
module.exports.TYPE = TYPE;
module.exports.PARAMS = PARAMS;

Voronoi.prototype.sql = function() {
    var sql = voronoiTemplate({
        source: this.source.getQuery(),
        buffer: this.buffer,
        tolerance: this.tolerance
    });

    debug(sql);

    return sql;
};

var voronoiTemplate = Node.template([
    'SELECT',
    '  row_number() over() AS cartodb_id,',
    '  the_geom',
    'FROM (',
    '  SELECT',
    '    cdb_crankshaft.CDB_voronoi(',
    '      geoms_array_input,',
    '      {{=it.buffer}}::numeric,',
    '      {{=it.tolerance}}::numeric',
    '    ) AS the_geom',
    '  FROM (',
    '    SELECT',
    '      array_agg(the_geom) AS geoms_array_input',
    '    FROM (',
    '      {{=it.source}}',
    '    ) _source',
    '  ) _source_as_array',
    ') _cdb_analysis_voronoi'
 ].join('\n'));
