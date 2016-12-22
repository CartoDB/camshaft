'use strict';

var Node = require('../node');
var limits = require('../limits');
var debug = require('../../util/debug')('analysis:georeference-country');

var TYPE = 'georeference-country';
var PARAMS = {
    source: Node.PARAM.NODE(Node.GEOMETRY.ANY),
    country_column: Node.PARAM.STRING()
};

var GeoreferenceCountry = Node.create(TYPE, PARAMS, {
    cache: true
});

module.exports = GeoreferenceCountry;

GeoreferenceCountry.prototype.sql = function() {
    var sql = queryTemplate({
        source: this.source.getQuery(),
        columns: this.source.getColumns(true).join(', '),
        country: this.country_column
    });

    debug(sql);

    return sql;
};

var queryTemplate = Node.template([
    'SELECT',
    '  {{=it.columns}},',
    '  cdb_dataservices_client._cdb_geocode_admin0_polygon_exception_safe({{=it.country}}) AS the_geom',
    'FROM ({{=it.source}}) AS _camshaft_georeference_country_analysis'
 ].join('\n'));

 GeoreferenceCountry.prototype.checkLimits = function(context, callback) {
     // given that country polygons are large and there are less than 200 countries in the world
     // we'll set a modest default limit for the number of resulting rows
     var limit = context.getLimit(TYPE, 'maximumNumberOfRows', 500, 'too many source rows');
     limits.limitInputRows(this, 'source', context, limit, callback);
 };
