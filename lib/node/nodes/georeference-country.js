'use strict';

var Node = require('../node');
var Checks = require('../../limits/checks');
var debug = require('../../util/debug')('analysis:georeference-country');

var TYPE = 'georeference-country';
var PARAMS = {
    source: Node.PARAM.NODE(Node.GEOMETRY.ANY),
    country_column: Node.PARAM.STRING()
};

var LIMITS = {
    maximumNumberOfRows: {
        default: 500,
        message: 'too many source rows'
    }
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
    '  cdb_dataservices_client.cdb_geocode_admin0_polygon({{=it.country}}) AS the_geom',
    'FROM ({{=it.source}}) AS _camshaft_georeference_country_analysis'
 ].join('\n'));

 GeoreferenceCountry.prototype.checkLimits = function(context, callback) {
     Checks.check(this, context, [{
         checker: Checks.limitInputRows,
         params: { input: 'source' },
         limits: LIMITS
     }], callback);
 };
