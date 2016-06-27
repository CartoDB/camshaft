'use strict';

var Node = require('../node');

var routingToSinglePointQueryTemplate = Node.getSqlTemplateFn('routing-to-single-point');

var TYPE = 'routing-to-single-point';
var PARAMS = {
    source: Node.PARAM.NODE(Node.GEOMETRY.POINT),
    mode: Node.PARAM.ENUM('car', 'walk', 'bicycle', 'public_transport'),
    destination_longitude: Node.PARAM.NUMBER(),
    destination_latitude: Node.PARAM.NUMBER(),
    units: Node.PARAM.NULLABLE(Node.PARAM.ENUM('kilometers', 'miles'), 'kilometers')
};

var RoutingToSinglePoint = Node.create(TYPE, PARAMS, { cache: true });

module.exports = RoutingToSinglePoint;
module.exports.TYPE = TYPE;
module.exports.PARAMS = PARAMS;

RoutingToSinglePoint.prototype.sql = function() {
    var template = routingToSinglePointQueryTemplate;

    return template({
        source: this.source.getQuery(),
        columns: this.source.getColumns(true).join(', '),
        destination_longitude: this.destination_longitude,
        destination_latitude: this.destination_latitude,
        mode: this.mode,
        mode_type:'shortest',
        units: this.units
    });
};
