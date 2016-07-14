'use strict';

var Node = require('../node');
var debug = require('../../util/debug')('analysis:georeference-postal-code');

var TYPE = 'georeference-postal-code';
var PARAMS = {
    source: Node.PARAM.NODE(Node.GEOMETRY.ANY),
    output_geometry_type: Node.PARAM.NULLABLE(
        Node.PARAM.ENUM(Node.GEOMETRY.POINT, Node.GEOMETRY.POLYGON),
        Node.GEOMETRY.POLYGON
    ),
    postal_code: Node.PARAM.STRING(),
    country: Node.PARAM.NULLABLE(Node.PARAM.STRING()),
    country_column: Node.PARAM.NULLABLE(Node.PARAM.STRING())
};

var GeoreferencePostalCode = Node.create(TYPE, PARAMS, {
    cache: true,
    beforeCreate: function (node) {
        if (!node.country && !node.country_column) {
            throw new Error('You must indicate "country" or "country_column" param');
        }
    }
});

module.exports = GeoreferencePostalCode;
module.exports.TYPE = TYPE;
module.exports.PARAMS = PARAMS;

GeoreferencePostalCode.prototype.sql = function() {
    var sql = queryTemplate({
        source: this.source.getQuery(),
        columns: this.source.getColumns(true).join(', '),
        geocoder_function: getGecoderFunction(this.output_geometry_type),
        postal_code: this.postal_code,
        country: this.getFunctionParam('country')
    });

    debug(sql);

    return sql;
};

GeoreferencePostalCode.prototype.getFunctionParam = function (name) {
    if (this[name + '_column']) {
        return this[name + '_column'];
    }

    if (this[name]) {
        return '\'' + this[name] + '\'';
    }

    return 'NULL';
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
