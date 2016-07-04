'use strict';

var Node = require('../node');

var TYPE = 'georeference-admin-region';
var PARAMS = {
    source: Node.PARAM.NODE(Node.GEOMETRY.ANY),
    admin_region: Node.PARAM.STRING(),
    country: Node.PARAM.STRING()
};

var GeoreferenceAdminRegion = Node.create(TYPE, PARAMS, { cache: true });

module.exports = GeoreferenceAdminRegion;
module.exports.TYPE = TYPE;
module.exports.PARAMS = PARAMS;

GeoreferenceAdminRegion.prototype.sql = function() {
    return queryTemplate({
        source: this.source.getQuery(),
        columns: this.source.getColumns(true).join(', '),
        city:this.city,
        admin_region: this.admin_region,
        country: this.country
    });
};

var queryTemplate = Node.template([
    'SELECT',
    '  {{=it.columns}},',
    '  cdb_geocode_admin1_polygon(' +
    '    {{=it.admin_region}},',
    '    {{=it.country}}',
    '  ) AS the_geom',
    'FROM ({{=it.source}}) AS _camshaft_georeference_admin_region_analysis'
 ].join('\n'));
