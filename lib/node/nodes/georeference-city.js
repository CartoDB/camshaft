'use strict';

var Node = require('../node');

var TYPE = 'georeference-city';
var PARAMS = {
    source: Node.PARAM.NODE(Node.GEOMETRY.ANY),
    city: Node.PARAM.STRING(),
    admin_region: Node.PARAM.STRING(),
    country: Node.PARAM.STRING(),
    provider: Node.PARAM.STRING()
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
        country: this.country,
        provider_function: getProviderFunction(this.provider)
    });
};

function getProviderFunction(providerName) {
    switch (providerName){
        case 'heremaps':
            return 'cdb_here_geocode_namedplace_point';
        case 'google':
            return 'cdb_google_geocode_namedplace_point';
        case 'mapzen':
            return 'cdb_mapzen_geocode_namedplace_point';
    default:
        return 'cdb_geocode_namedplace_point';
    }
}

var queryTemplate = Node.template([
    'SELECT',
    '  {{=it.columns}},',
    '  {{=it.provider_function}}(' +
    '    {{=it.city}},',
    '    {{=it.admin_region}},',
    '    {{=it.country}}',
    '  ) AS the_geom',
    'FROM ({{=it.source}}) AS _camshaft_georeference_city_analysis'
 ].join('\n'));
