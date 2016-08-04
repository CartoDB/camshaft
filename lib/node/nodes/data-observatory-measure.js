'use strict';

var Node = require('../node');

var TYPE = 'data-observatory-measure';
var PARAMS = {
    source: Node.PARAM.NODE(Node.GEOMETRY.POINT, Node.GEOMETRY.POLYGON),
    final_column: Node.PARAM.STRING(),
    segment_name: Node.PARAM.STRING(),
    percent: Node.PARAM.NULLABLE(Node.PARAM.BOOLEAN())
};

var DataObservatoryMeasure = Node.create(TYPE, PARAMS, { cache: true });

module.exports = DataObservatoryMeasure;
module.exports.TYPE = TYPE;
module.exports.PARAMS = PARAMS;

DataObservatoryMeasure.prototype.sql = function() {
    return queryTemplate({
        columns: this.source.getColumns().join(', '),
        source: this.source.getQuery(false),
        final_column: this.final_column,
        segment_name: this.segment_name,
        percent: this.percent ? 'denominator' : undefined
    });
};

var queryTemplate = Node.template([
    'SELECT',
    '  {{=it.columns}},',
    '  cdb_dataservices_client.OBS_GetMeasure(' +
    '    the_geom,' +
    '    \'{{=it.segment_name}}\'{{?it.percent}},',
    '    \'{{=it.percent}}\'{{?}}',
    '  ) AS {{=it.final_column}}',
    'FROM ({{=it.source}}) AS _camshaft_do_measure_analysis'
].join('\n'));
