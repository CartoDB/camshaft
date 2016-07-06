'use strict';

var Node = require('../node');

var TYPE = 'georeference-street-address';
var PARAMS = {
    source: Node.PARAM.NODE(Node.GEOMETRY.ANY),
    street_address: Node.PARAM.STRING(),
    city: Node.PARAM.NULLABLE(Node.PARAM.STRING()),
    state: Node.PARAM.NULLABLE(Node.PARAM.STRING()),
    country: Node.PARAM.NULLABLE(Node.PARAM.STRING()),
    provider: Node.PARAM.NULLABLE(
        Node.PARAM.ENUM('heremaps', 'google', 'mapzen', 'user_default'),
        'mapzen'
    )

};

var GeoreferenceStreetAddress = Node.create(TYPE, PARAMS, { cache: true });

module.exports = GeoreferenceStreetAddress;
module.exports.TYPE = TYPE;
module.exports.PARAMS = PARAMS;

GeoreferenceStreetAddress.prototype.sql = function() {
    return queryTemplate({
        source: this.source.getQuery(),
        columns: this.source.getColumns(true).join(', '),
        params: [
            this.street_address,
            this.city || 'NULL',
            this.state || 'NULL',
            this.country || 'NULL'
        ].join(', '),
        provider_function: getProviderFunction(this.provider)
    });
};

function getProviderFunction(providerName) {
    switch (providerName){
        case 'heremaps':
            return 'cdb_here_geocode_street_point';
        case 'google':
            return 'cdb_google_geocode_street_point';
        case 'mapzen':
             return 'cdb_mapzen_geocode_street_point';
        case 'user_default':
             return 'cdb_geocode_street_point';
    default:
        return 'cdb_geocode_street_point';
     }
 }

var queryTemplate = Node.template([
    'SELECT',
    '  {{=it.columns}},',
    '  {{=it.provider_function}}(' +
    '    {{=it.params}}',
    '  ) AS the_geom',
    'FROM ({{=it.source}}) AS _camshaft_georeference_street_address_analysis'
 ].join('\n'));
