'use strict';

var Node = require('../node');
var dot = require('dot');
dot.templateSettings.strip = false;

var TYPE = 'link-by-line';

var PARAMS = {
    source_points: Node.PARAM.NODE(Node.GEOMETRY.POINT),
    destination_points: Node.PARAM.NODE(Node.GEOMETRY.POINT),
    source_column: Node.PARAM.STRING(),
    destination_column: Node.PARAM.STRING(),
    use_great_circle: Node.PARAM.BOOLEAN()
};

var LinkByLine = Node.create(TYPE, PARAMS, {cache: true});

module.exports = LinkByLine;
module.exports.TYPE = TYPE;
module.exports.PARAMS = PARAMS;

var linkByLineTemplate = dot.template([
    'with source as(',
    '  select * from ({{=it.sourceQuery}}) a ' ,
    '),',
    'dest as (',
    '  select * from ({{=it.destQuery}}) b ',
    ')',
    'select {{=it.lineFunc}}(source.the_geom, dest.the_geom) as the_geom, {{=it.sourceColumns}}, {{=it.targetColumns}}',
    'from source, dest',
    'where source.{{=it.source_id}} = dest.{{=it.dest_id}}',
].join('\n'));

var featureColumns = function(columns,prefix){
    return columns.filter(function(col) {
        return ['cartodb_id'].indexOf(col) === -1;
    }).map(function(col){ 
        return prefix + '.' + col + ' as ' + prefix + '_' + col;
    }).join(',');
};

LinkByLine.prototype.sql = function(){
    var lineFunc = this.use_great_circle ? 'CDB_GreatCircle' : 'ST_MakeLine';
    return linkByLineTemplate({
        sourceQuery : this.source_points.getQuery(),
        destQuery : this.dest_points.getQuery(),
        source_id: this.id_column_source,
        dest_id  : this.id_column_dest,
        sourceColumns: featureColumns(this.source_points.getColumns(), 'source'),
        targetColumns: featureColumns(this.dest_points.getColumns(), 'dest'),
        lineFunc: lineFunc
    });
};
