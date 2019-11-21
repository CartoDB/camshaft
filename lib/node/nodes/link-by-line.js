'use strict';

var Node = require('../node');

var TYPE = 'link-by-line';

var PARAMS = {
    source_points: Node.PARAM.NODE(Node.GEOMETRY.POINT),
    destination_points: Node.PARAM.NODE(Node.GEOMETRY.POINT),
    source_column: Node.PARAM.STRING(),
    destination_column: Node.PARAM.STRING(),
    use_great_circle: Node.PARAM.NULLABLE(Node.PARAM.BOOLEAN(), false)
};

var LinkByLine = Node.create(TYPE, PARAMS, {cache: true});

module.exports = LinkByLine;

var linkByLineTemplate = Node.template([
    'with source as(',
    '  select * from ({{=it.sourceQuery}}) a' ,
    '),',
    'destination as (',
    '  select * from ({{=it.destinationQuery}}) b',
    ')',
    'SELECT',
    '  {{=it.lineFunc}}(source.the_geom, destination.the_geom) as the_geom,',
    '  {{=it.sourceColumns}}, {{=it.destinationColumns}}',
    'FROM source, destination',
    'WHERE source.{{=it.sourceColumn}} = destination.{{=it.destinationColumn}}'
].join('\n'));

var featureColumns = function(columns,prefix){
    return columns.map(function(col){
        return prefix + '.' + col + ' as ' + prefix + '_' + col;
    }).join(',');
};

LinkByLine.prototype.sql = function(){
    var lineFunc = this.use_great_circle ? 'CDB_GreatCircle' : 'ST_MakeLine';
    const ignoreGeom = true;
    const ignoredCols = ['cartodb_id'];
    return linkByLineTemplate({
        sourceQuery: this.source_points.getQuery(),
        destinationQuery: this.destination_points.getQuery(),
        sourceColumn: this.source_column,
        destinationColumn: this.destination_column,
        sourceColumns: this.source_points.getColumns(ignoreGeom).map(function(c) { return 'source.' + c; }),
        destinationColumns: featureColumns(this.destination_points.getColumns(ignoreGeom, ignoredCols), 'destination'),
        lineFunc: lineFunc
    });
};
