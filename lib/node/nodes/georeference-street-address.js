'use strict';

var Node = require('../node');
var debug = require('../../util/debug')('analysis:georeference-street-address');

var TYPE = 'georeference-street-address';
var PARAMS = {
    source: Node.PARAM.NODE(Node.GEOMETRY.ANY),
    street_address: Node.PARAM.STRING(),
    city: Node.PARAM.NULLABLE(Node.PARAM.STRING()),
    city_column: Node.PARAM.NULLABLE(Node.PARAM.STRING()),
    state: Node.PARAM.NULLABLE(Node.PARAM.STRING()),
    state_column: Node.PARAM.NULLABLE(Node.PARAM.STRING()),
    country: Node.PARAM.NULLABLE(Node.PARAM.STRING()),
    country_column: Node.PARAM.NULLABLE(Node.PARAM.STRING()),
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
    var geocoderParams = [
        this.street_address,
        this.getFunctionParam('city'),
        this.getFunctionParam('state'),
        this.getFunctionParam('country')
    ];

    var sql = queryTemplate({
        source: this.source.getQuery(),
        columns: this.source.getColumns(true).join(', '),
        provider_function: getProviderFunction(this.provider),
        params: geocoderParams.join(', ')
    });

    debug(sql);

    return sql;
};

GeoreferenceStreetAddress.prototype.getFunctionParam = function (name) {
    if (this[name + '_column']) {
        return this[name + '_column'];
    }

    if (this[name]) {
        return '\'' + this[name] + '\'';
    }

    return 'NULL';
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
    '  cdb_dataservices_client.{{=it.provider_function}}(' +
    '    {{=it.params}}',
    '  ) AS the_geom',
    'FROM ({{=it.source}}) AS _camshaft_georeference_street_address_analysis'
 ].join('\n'));
