'use strict';

var Node = require('../node');

var TYPE = 'georeference-admin-region';
var PARAMS = {
    source: Node.PARAM.NODE(Node.GEOMETRY.ANY),
    admin_region: Node.PARAM.NULLABLE(Node.PARAM.STRING()),
    country: Node.PARAM.NULLABLE(Node.PARAM.STRING())
};

var GeoreferenceAdminRegion = Node.create(TYPE, PARAMS, { cache: true });

module.exports = GeoreferenceAdminRegion;
module.exports.TYPE = TYPE;
module.exports.PARAMS = PARAMS;

GeoreferenceAdminRegion.prototype.sql = function() {
    var geocoderFunction = '';
    var geocoderParams = [];

    if (this.country && !this.admin_region) {
        // country geocoder
        geocoderFunction = 'cdb_geocode_admin0_polygon';
        geocoderParams.push(this.country);
    } else {
        // adm. region geocoder
        geocoderFunction = 'cdb_geocode_admin1_polygon';
        geocoderParams.push(this.admin_region);

        if (this.country) {
            geocoderParams.push(this.country);
        }
    }

    return queryTemplate({
        source: this.source.getQuery(),
        columns: this.source.getColumns(true).join(', '),
        geocoder_function: geocoderFunction,
        geocoder_params: geocoderParams.map(function (param) {
            return '\'' + param + '\'';
        }).join(', ')
    });
};

var queryTemplate = Node.template([
    'SELECT',
    '  {{=it.columns}},',
    '  cdb_dataservices_client.{{=it.geocoder_function}}(' +
    '    {{=it.geocoder_params}}',
    '  ) AS the_geom',
    'FROM ({{=it.source}}) AS _camshaft_georeference_admin_region_analysis'
 ].join('\n'));
