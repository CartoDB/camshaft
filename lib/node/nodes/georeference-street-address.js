'use strict';

var Node = require('../node');
var debug = require('../../util/debug')('analysis:georeference-street-address');

var TYPE = 'georeference-street-address';
var PARAMS = {
    source: Node.PARAM.NODE(Node.GEOMETRY.ANY),
    street_address_columns: Node.PARAM.NULLABLE(Node.PARAM.ARRAY(Node.PARAM.STRING())),
    city: Node.PARAM.NULLABLE(Node.PARAM.STRING()),
    city_column: Node.PARAM.NULLABLE(Node.PARAM.STRING()),
    state: Node.PARAM.NULLABLE(Node.PARAM.STRING()),
    state_column: Node.PARAM.NULLABLE(Node.PARAM.STRING()),
    country: Node.PARAM.NULLABLE(Node.PARAM.STRING()),
    country_column: Node.PARAM.NULLABLE(Node.PARAM.STRING())
};

var GeoreferenceStreetAddress = Node.create(TYPE, PARAMS, { cache: true, version: 1 });

module.exports = GeoreferenceStreetAddress;

GeoreferenceStreetAddress.prototype.sql = function() {
    var sql = queryTemplate({
        source: this.source.getQuery(),
        columns: this.source.getColumns(true).join(', '),
        params: this.getGeocoderParams().join(', ')
    });

    debug(sql);

    return sql;
};

GeoreferenceStreetAddress.prototype.getGeocoderParams = function () {
    var geocoderParams = [
        this.getFunctionParam('street_address'),
        this.getFunctionParam('city'),
        this.getFunctionParam('state'),
        this.getFunctionParam('country')
    ];

    return geocoderParams;
};


GeoreferenceStreetAddress.prototype.getFunctionParam = function (name) {
    if (this[name + '_columns']) {
        return this[name + '_columns'].map(function (column) {
            return column;
        }).join(' || \' \' || ');
    }

    if (this[name + '_column']) {
        return this[name + '_column'];
    }

    if (this[name]) {
        return '\'' + this[name] + '\'';
    }

    return 'NULL';
};

var queryTemplate = Node.template([
    'SELECT',
    '  {{=it.columns}},',
    '  cdb_dataservices_client._cdb_geocode_street_point_exception_safe(' +
    '    {{=it.params}}',
    '  ) AS the_geom',
    'FROM ({{=it.source}}) AS _camshaft_georeference_street_address_analysis'
].join('\n'));
