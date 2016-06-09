'use strict';

var dot = require('dot');
dot.templateSettings.strip = false;

var Node = require('../node');

var TYPE = 'data-observatory-measure';
var PARAMS = {
    source: Node.PARAM.NODE(Node.GEOMETRY.POLYGON),
    new_column_name: Node.PARAM.STRING,
    segment_name: Node.PARAM.STRING,
    percent: Node.PARAM.BOOLEAN,
};

var DataObservatoryMeasure = Node.create(TYPE, PARAMS, { cache: true });

module.exports = DataObservatoryMeasure;
module.exports.TYPE = TYPE;
module.exports.PARAMS = PARAMS;

DataObservatoryMeasure.prototype.sql = function() {
    return query({
        columns: this.source.getColumns().join(', '),
        source: this.source.getQuery(),
        new_column_name: this.new_column_name,
        segment_name: this.segment_name,
        percent: this.percent ? 'denominator' : undefined
    });
};

var queryTemplate = dot.template([
    'SELECT',
    '  {{=it.columns}},',
    '  OBS_GetMeasure(' +
    '    the_geom,' +
    '    \'{{=it.segment_name}}\'{{?it.percent}},',
    '    \'{{=it.percent}}\'{{?}}',
    '  ) AS {{=it.new_column_name}}',
    'FROM ({{=it.source}}) AS _camshaft_do_measure_analysis'
].join('\n'));

function query(it) {
    return queryTemplate(it);
}
