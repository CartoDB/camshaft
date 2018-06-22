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
        columns: this.source.getColumns(true).join(', '),
        country_column: this.getFunctionParam('country'),
        state_column: this.getFunctionParam('state'),
        city_column: this.getFunctionParam('city'),
        street_column: this.getStreetAddressColumnParam(),
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
        return '\'' + this[name + '_column'] + '\'';
    }

    if (this[name]) {
        return "'''" + this[name] + "'''";
    }

    return 'NULL';
};

var queryTemplate = Node.template([
    'SELECT',
    '   {{=it.columns}}, ',
    '   _y.the_geom, st_transform(st_setsrid(_y.the_geom, 4326), 3857) as the_geom_webmercator, _y.metadata ',
    'FROM',
    '   ({{=it.source}}) _x',
    '   LEFT JOIN',
    '   (SELECT * from ' +
    '       cdb_dataservices_client.cdb_bulk_geocode_street_point(' +
    '               \'select * from ({{=it.source}}) __x\', ' +
    '               {{=it.country_column}},' +
    '               {{=it.state_column}},' +
    '               {{=it.city_column}},' +
    '               {{=it.street_column}}' +
    '       )) _y',
    '   USING (cartodb_id) '
].join('\n'));
