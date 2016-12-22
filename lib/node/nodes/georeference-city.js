'use strict';

var Node = require('../node');
var debug = require('../../util/debug')('analysis:georeference-city');

var TYPE = 'georeference-city';
var PARAMS = {
    source: Node.PARAM.NODE(Node.GEOMETRY.ANY),
    city_column: Node.PARAM.STRING(),
    admin_region: Node.PARAM.NULLABLE(Node.PARAM.STRING()),
    admin_region_column: Node.PARAM.NULLABLE(Node.PARAM.STRING()),
    country: Node.PARAM.NULLABLE(Node.PARAM.STRING()),
    country_column: Node.PARAM.NULLABLE(Node.PARAM.STRING())
};

var GeoreferenceCity = Node.create(TYPE, PARAMS, {
    cache: true,
    beforeCreate: function (node) {
        if (node.getFunctionParam('admin_region') && !node.getFunctionParam('country')) {
            throw new Error('Missing required param "country".' +
                ' Param "admin_region" must be used along with "country" param');
        }
    }
});

module.exports = GeoreferenceCity;

GeoreferenceCity.prototype.sql = function() {
    var sql = queryTemplate({
        source: this.source.getQuery(),
        columns: this.source.getColumns(true).join(', '),
        geocoder_params: this.getGeocoderParams().join(', ')
    });

    debug(sql);

    return sql;
};

GeoreferenceCity.prototype.getGeocoderParams = function () {
    var geocoderParams = [];

    geocoderParams.push(this.getFunctionParam('city'));

    if (this.getFunctionParam('admin_region') && this.getFunctionParam('country')) {
        geocoderParams.push(this.getFunctionParam('admin_region'));
        geocoderParams.push(this.getFunctionParam('country'));
    } else if (this.getFunctionParam('country')) {
        geocoderParams.push(this.getFunctionParam('country'));
    }

    return geocoderParams;
};

GeoreferenceCity.prototype.getFunctionParam = function (name) {
    if (this[name + '_column']) {
        return this[name + '_column'];
    }

    if (this[name]) {
        return '\'' + this[name] + '\'';
    }
};

var queryTemplate = Node.template([
    'SELECT',
    '  {{=it.columns}},',
    '  cdb_dataservices_client._cdb_geocode_namedplace_point_exception_safe(' +
    '    {{=it.geocoder_params}}',
    '  ) AS the_geom',
    'FROM ({{=it.source}}) AS _camshaft_georeference_city_analysis'
 ].join('\n'));
