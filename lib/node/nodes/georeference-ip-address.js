'use strict';

var Node = require('../node');

var TYPE = 'georeference-ip-address';
var PARAMS = {
    source: Node.PARAM.NODE(Node.GEOMETRY.ANY),
    ip_address: Node.PARAM.STRING()
};

var GeoreferenceIpAddress = Node.create(TYPE, PARAMS, { cache: true });

module.exports = GeoreferenceIpAddress;

GeoreferenceIpAddress.prototype.sql = function() {
    return queryTemplate({
        source: this.source.getQuery(),
        columns: this.source.getColumns(true).join(', '),
        ip_address: this.ip_address
    });
};

var queryTemplate = Node.template([
    'SELECT',
    '  {{=it.columns}},',
    '  cdb_dataservices_client.cdb_geocode_ipaddress_point(' +
    '    {{=it.ip_address}}',
    '  ) AS the_geom',
    'FROM ({{=it.source}}) AS _camshaft_georeference_ip_address_analysis'
 ].join('\n'));
