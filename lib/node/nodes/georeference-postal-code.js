'use strict';

var Node = require('../node');

var TYPE = 'georeference-postal-code';
var PARAMS = {
    source: Node.PARAM.NODE(Node.GEOMETRY.ANY),
    output_geometry_type: Node.PARAM.NULLABLE(
        Node.PARAM.ENUM(Node.GEOMETRY.POINT, Node.GEOMETRY.POLYGON),
        Node.GEOMETRY.POLYGON
    ),
    postal_code: Node.PARAM.STRING(),
    country: Node.PARAM.STRING()
};

var GeoreferencePostalCode = Node.create(TYPE, PARAMS, { cache: true });

module.exports = GeoreferencePostalCode;
module.exports.TYPE = TYPE;
module.exports.PARAMS = PARAMS;

GeoreferencePostalCode.prototype.sql = function() {
    return queryTemplate({
        source: this.source.getQuery(),
        columns: this.source.getColumns(true).join(', '),
        geocoder_function: getGecoderFunction(this.output_geometry_type),
        postal_code: this.postal_code,
        country: this.country
    });
};

function getGecoderFunction(geometryType) {
    switch (geometryType){
        case Node.GEOMETRY.POLYGON:
            return 'cdb_geocode_postalcode_polygon';
        case Node.GEOMETRY.POINT:
            return 'cdb_google_geocode_street_point';
    default:
        return 'cdb_google_geocode_street_point';
     }
}

var queryTemplate = Node.template([
    'SELECT',
    '  {{=it.columns}},',
    '  cdb_dataservices_client.{{=it.geocoder_function}}(' +
    '    {{=it.postal_code}},',
    '    {{=it.country}}',
    '  ) AS the_geom',
    'FROM ({{=it.source}}) AS _camshaft_georeference_postal_code_analysis'
 ].join('\n'));
