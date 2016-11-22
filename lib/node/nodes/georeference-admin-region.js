'use strict';

var Node = require('../node');
var limits = require('../limits');
var debug = require('../../util/debug')('analysis:georeference-admin-region');

var TYPE = 'georeference-admin-region';
var PARAMS = {
    source: Node.PARAM.NODE(Node.GEOMETRY.ANY),
    admin_region_column: Node.PARAM.STRING(),
    country: Node.PARAM.NULLABLE(Node.PARAM.STRING()),
    country_column: Node.PARAM.NULLABLE(Node.PARAM.STRING())
};

var GeoreferenceAdminRegion = Node.create(TYPE, PARAMS, { cache: true });

module.exports = GeoreferenceAdminRegion;

GeoreferenceAdminRegion.prototype.sql = function() {
    var sql = queryTemplate({
        source: this.source.getQuery(),
        columns: this.source.getColumns(true).join(', '),
        geocoder_params: this.getGeocoderParams().join(', ')
    });

    debug(sql);

    return sql;
};

GeoreferenceAdminRegion.prototype.getGeocoderParams = function () {
    var geocoderParams = [];

    geocoderParams.push(this.getFunctionParam('admin_region'));
    if (this.getFunctionParam('country')) {
        geocoderParams.push(this.getFunctionParam('country'));
    }

    return geocoderParams;
};

GeoreferenceAdminRegion.prototype.getFunctionParam = function (name) {
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
    '  cdb_dataservices_client.cdb_geocode_admin1_polygon(' +
    '    {{=it.geocoder_params}}',
    '  ) AS the_geom',
    'FROM ({{=it.source}}) AS _camshaft_georeference_admin_region_analysis'
 ].join('\n'));

 GeoreferenceAdminRegion.prototype.checkLimits = function(context, callback) {
     var limit = context.getLimit(TYPE, 'maximumNumberOfRows', 1000, 'too many source rows');
     limits.limitSingleInputRows(this, 'source', context, limit, callback);
 };
