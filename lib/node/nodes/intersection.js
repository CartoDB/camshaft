'use strict';

var Node = require('../node');
var debug = require('../../util/debug')('analysis:intersection');

var TYPE = 'intersection';
var PARAMS = {
    source: Node.PARAM.NODE(Node.GEOMETRY.ANY),
    source_columns: Node.PARAM.NULLABLE(Node.PARAM.ARRAY(Node.PARAM.STRING()), []),
    target: Node.PARAM.NODE(Node.GEOMETRY.ANY),
};

var Intersection = Node.create(TYPE, PARAMS, { cache: true, version: 4 });

module.exports = Intersection;

Intersection.prototype.sql = function() {

    if (!this.source_columns.length) {
        this.source_columns = this.source.getColumns({ ignoreGeomColumns: true });
    }

    var prefixedSourceColumns = this.source_columns.map(function (name) {
        let unquoted_name = name;
        const quotedName = name.length > 2 && name[0] === '"' && name[name.length - 1] === '"';
        if (quotedName)
        {
            unquoted_name = name.substring(1, name.length - 1);
        }

        return `_cdb_analysis_source.${name} as "source_${unquoted_name}"`;
    });

    var sql = queryTemplate({
        sourceQuery: this.source.getQuery(),
        targetQuery: this.target.getQuery(),
        columns: ['_cdb_analysis_target.*'].concat(prefixedSourceColumns).join(',')
    });

    debug(sql);

    return sql;
};

var queryTemplate = Node.template([
    'SELECT {{=it.columns}}',
    'FROM ({{=it.sourceQuery}}) _cdb_analysis_source, ({{=it.targetQuery}}) _cdb_analysis_target',
    'WHERE ST_Intersects(_cdb_analysis_source.the_geom, _cdb_analysis_target.the_geom)'
].join('\n'));
