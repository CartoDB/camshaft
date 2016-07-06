'use strict';

var Node = require('../node');

var TYPE = 'georeference-city';
var PARAMS = {
    source: Node.PARAM.NODE(Node.GEOMETRY.ANY),
    city: Node.PARAM.STRING(),
    admin_region: Node.PARAM.STRING(),
    country: Node.PARAM.STRING()
};

var GeoreferenceCity = Node.create(TYPE, PARAMS, { cache: true });

module.exports = GeoreferenceCity;
module.exports.TYPE = TYPE;
module.exports.PARAMS = PARAMS;

GeoreferenceCity.prototype.sql = function() {
    return queryTemplate({
        source: this.source.getQuery(),
        columns: this.source.getColumns(true).join(', '),
        city: this.city,
        admin_region: this.admin_region,
        country: this.country
    });
};

var queryTemplate = Node.template([
    'SELECT',
    '  {{=it.columns}},',
    '  cdb_dataservices_client.cdb_geocode_namedplace_point(' +
    '    {{=it.city}},',
    '    {{=it.admin_region}},',
    '    {{=it.country}}',
    '  ) AS the_geom',
    'FROM ({{=it.source}}) AS _camshaft_georeference_city_analysis'
 ].join('\n'));
