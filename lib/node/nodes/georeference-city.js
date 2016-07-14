'use strict';

var Node = require('../node');

var TYPE = 'georeference-city';
var PARAMS = {
    source: Node.PARAM.NODE(Node.GEOMETRY.ANY),
    city: Node.PARAM.STRING(),
    admin_region: Node.PARAM.NULLABLE(Node.PARAM.STRING()),
    country: Node.PARAM.NULLABLE(Node.PARAM.STRING())
};

var GeoreferenceCity = Node.create(TYPE, PARAMS, { cache: true });

module.exports = GeoreferenceCity;
module.exports.TYPE = TYPE;
module.exports.PARAMS = PARAMS;

GeoreferenceCity.prototype.sql = function() {
    var geocoderParams = [this.city];

    if (this.admin_region) {
        geocoderParams.push(this.admin_region);
    }

    if (this.country) {
        geocoderParams.push(this.country);
    }

    return queryTemplate({
        source: this.source.getQuery(),
        columns: this.source.getColumns(true).join(', '),
        geocoder_params: geocoderParams.map(function (param) {
            return '\'' + param + '\'';
        }).join(', ')
    });
};

var queryTemplate = Node.template([
    'SELECT',
    '  {{=it.columns}},',
    '  cdb_dataservices_client.cdb_geocode_namedplace_point(' +
    '    {{=it.geocoder_params}}',
    '  ) AS the_geom',
    'FROM ({{=it.source}}) AS _camshaft_georeference_city_analysis'
 ].join('\n'));
