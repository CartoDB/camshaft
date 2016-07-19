'use strict';

var Node = require('../node');
var debug = require('../../util/debug')('analysis:intersection');

var TYPE = 'intersection';
var PARAMS = {
    source: Node.PARAM.NODE(Node.GEOMETRY.ANY),
    source_columns: Node.PARAM.NULLABLE(Node.PARAM.ARRAY(Node.PARAM.STRING()), []),
    target: Node.PARAM.NODE(Node.GEOMETRY.ANY),
};

var Intersection = Node.create(TYPE, PARAMS, {
    cache: true,
    version: 4,
    beforeCreate: function (node) {
        if (!node.source_columns.length) {
            node.source_columns = node.source.getColumns(true);
        }
    }
});

module.exports = Intersection;
module.exports.TYPE = TYPE;
module.exports.PARAMS = PARAMS;

Intersection.prototype.sql = function() {
    var sql = queryTemplate({
        sourceQuery: this.source.getQuery(),
        targetQuery: this.target.getQuery(),
        columns: ['_cdb_analysis_target.*'].concat(this.source_columns.map(function (name) {
            return '_cdb_analysis_source.' + name + ' as source_' + name;
        })).join(',')
    });

    debug(sql);

    return sql;
};

var queryTemplate = Node.template([
    'SELECT {{=it.columns}}',
    'FROM ({{=it.sourceQuery}}) _cdb_analysis_source, ({{=it.targetQuery}}) _cdb_analysis_target',
    'WHERE ST_Intersects(_cdb_analysis_source.the_geom, _cdb_analysis_target.the_geom)'
].join('\n'));
