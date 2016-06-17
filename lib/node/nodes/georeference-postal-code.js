'use strict';

var dot = require('dot');
dot.templateSettings.strip = false;

var Node = require('../node');

var TYPE = 'georeference-postal-code';
var PARAMS = {
    source: Node.PARAM.NODE(),
    postal_code: Node.PARAM.STRING(),
    country: Node.PARAM.STRING()
};

var GeoreferencePostalCode = Node.create(TYPE, PARAMS);

module.exports = GeoreferencePostalCode;
module.exports.TYPE = TYPE;
module.exports.PARAMS = PARAMS;

GeoreferencePostalCode.prototype.sql = function() {
    return queryTemplate({
        source: this.source.getQuery(),
        columns: this.source.getColumns().join(', '),
        postal_code: this.postal_code,
        country: this.country
    });
};

var queryTemplate = dot.template([
    'SELECT',
    '  {{=it.columns}},',
    '  cdb_geocode_postalcode_polygon(' +
    '    {{=it.postal_code}},',
    '    {{=it.country}}',
    '  ) AS the_geom',
    'FROM ({{=it.source}}) AS _camshaft_georeference_postal_code_analysis'
 ].join('\n'));
