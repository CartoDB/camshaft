'use strict';

var Node = require('../node');
var debug = require('../../util/debug')('analysis:georeference-street-address');

var TYPE = 'georeference-street-address';
var PARAMS = {
    source: Node.PARAM.NODE(Node.GEOMETRY.ANY),
    street_address_column: Node.PARAM.NULLABLE(Node.PARAM.STRING()),
    street_address_template: Node.PARAM.NULLABLE(Node.PARAM.STRING()),
    city: Node.PARAM.NULLABLE(Node.PARAM.STRING()),
    city_column: Node.PARAM.NULLABLE(Node.PARAM.STRING()),
    state: Node.PARAM.NULLABLE(Node.PARAM.STRING()),
    state_column: Node.PARAM.NULLABLE(Node.PARAM.STRING()),
    country: Node.PARAM.NULLABLE(Node.PARAM.STRING()),
    country_column: Node.PARAM.NULLABLE(Node.PARAM.STRING())
};

var GeoreferenceStreetAddress = Node.create(TYPE, PARAMS, { cache: true,
    beforeCreate: function() {
        if (this.street_address_column === null && this.street_address_template === null) {
            throw new Error('Either `street_address_column` or `street_address_template` params must be provided');
        }
    }
});

module.exports = GeoreferenceStreetAddress;

GeoreferenceStreetAddress.prototype.sql = function() {
    var sql = queryTemplate({
        source: this.source.getQuery(),
        street_column: this.getStreetAddressColumnParam(),
        columns: this.source.getColumns(true).join(', '),
        params: this.getGeocoderParams().join(', ')
    });

    debug(sql);

    return sql;
};

GeoreferenceStreetAddress.prototype.getGeocoderParams = function () {
    var geocoderParams = [
        this.getStreetAddressColumnParam(),
        this.getFunctionParam('city'),
        this.getFunctionParam('state'),
        this.getFunctionParam('country')
    ];

    return geocoderParams;
};

var COLUMNS_TEMPLATE_REGEX = /\{\{([^\}]*)\}\}/g;
GeoreferenceStreetAddress.prototype.getStreetAddressColumnParam = function() {
    if (this.street_address_column) {
        return this.getFunctionParam('street_address');
    }

    var columns = [];
    var result = this.street_address_template.replace(COLUMNS_TEMPLATE_REGEX, function(s, column) {
        columns.push(column.trim());
        return '%s';
    });

    if (columns.length === 0) {
        return '$tpl$' + this.street_address_template + '$tpl$';
    }

    return 'format($tpl$'+result+'$tpl$, ' + columns.join(', ') + ')';
};

GeoreferenceStreetAddress.prototype.getFunctionParam = function (name) {
    if (this[name + '_column']) {
        return this[name + '_column'];
    }

    if (this[name]) {
        return '\'' + this[name] + '\'';
    }

    return 'NULL';
};

/*var queryTemplate = Node.template([
    'SELECT',
    '  {{=it.columns}},',
    '  cdb_dataservices_client._cdb_geocode_street_point_exception_safe(' +
    '    {{=it.params}}',
    '  ) AS the_geom',
    'FROM ({{=it.source}}) AS _camshaft_georeference_street_address_analysis'
 ].join('\n'));*/

 var queryTemplate = Node.template([
    'WITH geocoding_data as (',
    '   SELECT json_build_object(\'id\', cartodb_id, \'address\', {{=it.street_column}}) as data , floor(cartodb_id/100) as batch',
    '   FROM ({{=it.source}}) AS _camshaft_georeference_street_address_analysis',
    '   ORDER BY cartodb_id',
    ')',
    'SELECT (cdb_dataservices_client._cdb_bulk_geocode_street_point_exception_safe(jsonb_agg(data))).*',
    'FROM geocoding_data',
    'GROUP BY batch',
    'ORDER BY batch'
 ].join('\n'));
