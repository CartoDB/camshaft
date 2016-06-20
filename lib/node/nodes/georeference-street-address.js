'use strict';

var dot = require('dot');
dot.templateSettings.strip = false;

var Node = require('../node');

var TYPE = 'georeference-street-address';
var PARAMS = {
    source: Node.PARAM.NODE(Node.GEOMETRY.ANY),
    street_address: Node.PARAM.STRING(),
    city: Node.PARAM.NULLABLE(Node.PARAM.STRING()),
    state: Node.PARAM.NULLABLE(Node.PARAM.STRING()),
    country: Node.PARAM.NULLABLE(Node.PARAM.STRING())
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
        ].join(', ')
    });
};

var queryTemplate = dot.template([
    'SELECT',
    '  {{=it.columns}},',
    '  cdb_geocode_street_point(' +
    '    {{=it.params}}',
    '  ) AS the_geom',
    'FROM ({{=it.source}}) AS _camshaft_georeference_street_address_analysis'
 ].join('\n'));
