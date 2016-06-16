'use strict';

var dot = require('dot');
dot.templateSettings.strip = false;

var Node = require('../node');

var TYPE = 'georeference-city';
var PARAMS = {
    source: Node.PARAM.NODE(),
    city: Node.PARAM.STRING(),
    admin_region: Node.PARAM.STRING(),
    country: Node.PARAM.STRING()
};

var GeoreferenceCity = Node.create(TYPE, PARAMS);

module.exports = GeoreferenceCity;
module.exports.TYPE = TYPE;
module.exports.PARAMS = PARAMS;

GeoreferenceCity.prototype.sql = function() {
    return queryTemplate({
        source: this.source.getQuery(),
        columns: this.source.getColumns().join(', '),
        city:this.city,
        admin_region: this.admin_region,
        country: this.country
    });
};

var queryTemplate = dot.template([
    'SELECT',
    '  {{=it.columns}},',
    '  cdb_geocode_namedplace_point(' +
    '    {{=it.city}},',
    '    {{=it.admin_region}},',
    '    {{=it.country}}',
    '  ) AS the_geom',
    'FROM ({{=it.source}}) AS _camshaft_georeference_city_analysis'
 ].join('\n'));
