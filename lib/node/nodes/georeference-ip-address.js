'use strict';

var dot = require('dot');
dot.templateSettings.strip = false;

var Node = require('../node');

var TYPE = 'georeference-ip-address';
var PARAMS = {
    source: Node.PARAM.NODE(),
    ip_address: Node.PARAM.STRING()
};

var GeoreferenceIpAddress = Node.create(TYPE, PARAMS);

module.exports = GeoreferenceIpAddress;
module.exports.TYPE = TYPE;
module.exports.PARAMS = PARAMS;

GeoreferenceIpAddress.prototype.sql = function() {
    return queryTemplate({
        source: this.source.getQuery(),
        columns: this.source.getColumns().join(', '),
        ip_address: this.ip_address
    });
};

var queryTemplate = dot.template([
    'SELECT',
    '  {{=it.columns}},',
    '  cdb_geocode_ipaddress_point(' +
    '    {{=it.ip_address}}',
    '  ) AS the_geom',
    'FROM ({{=it.source}}) AS _camshaft_georeference_ip_address_analysis'
 ].join('\n'));
