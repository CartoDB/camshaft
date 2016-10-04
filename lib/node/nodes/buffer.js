'use strict';

var Node = require('../node');

var TYPE = 'buffer';
var PARAMS = {
    source: Node.PARAM.NODE(Node.GEOMETRY.ANY),
    radius: Node.PARAM.NUMBER(),
    isolines: Node.PARAM.NULLABLE(Node.PARAM.NUMBER()),
    dissolved: Node.PARAM.NULLABLE(Node.PARAM.BOOLEAN())
};

var Buffer = Node.create(TYPE, PARAMS, { cache: true, version: 2 });

module.exports = Buffer;

Buffer.prototype.sql = function() {
    if (this.isolines > 1) {
        if (this.dissolved) {
            return this.isolinesDissolvedQuery();
        } else {
            return this.isolinesQuery();
        }
    } else {
        if (this.dissolved) {
            return this.radiusDissolvedQuery();
        } else {
            return this.radiusQuery();
        }
    }
};

var radiusQueryTpl = Node.template([
    'SELECT',
    '{{=it._columns}}',
    'FROM ({{=it._query}}) _camshaft_buffer'
].join('\n'));

Buffer.prototype.radiusQuery = function() {
    var _columns = [
        'ST_Buffer(the_geom::geography, ' + this.radius + ')::geometry the_geom'
    ].concat(this.source.getColumns(true));
    return radiusQueryTpl({
        _columns: _columns.join(','),
        _query: this.source.getQuery()
    });
};

Buffer.prototype.radiusDissolvedQuery = function() {
    return radiusQueryTpl({
        _columns: 'ST_Union(ST_Buffer(the_geom::geography, ' + this.radius + ')::geometry) the_geom',
        _query: this.source.getQuery()
    });
};

var isolinesQueryTpl = Node.template([
    'SELECT',
    '{{=it._columns}}',
    'FROM',
    '(SELECT _camshaft_isolines_r from generate_series(1, {{=it._isolines}}) as _camshaft_isolines_r) _q,',
    '({{=it._query}}) _camshaft_buffer_isolines',
    'ORDER BY _camshaft_isolines_r DESC'
].join('\n'));
var isolineGeomTpl = Node.template(
    'ST_Buffer(the_geom::geography, ({{=it._radius}} / {{=it._isolines}}) * _camshaft_isolines_r)::geometry the_geom'
);
var isolineDataRangeTpl = Node.template(
    '({{=it._radius}} / {{=it._isolines}}) * _camshaft_isolines_r AS data_range'
);

Buffer.prototype.isolinesQuery = function() {
    var _columns = [
        'the_geom AS center',
        isolineGeomTpl({ _radius: this.radius, _isolines: this.isolines }),
        isolineDataRangeTpl({ _radius: this.radius, _isolines: this.isolines })
    ].concat(this.source.getColumns(true));
    return isolinesQueryTpl({
        _columns: _columns.join(','),
        _isolines: this.isolines,
        _query: this.source.getQuery()
    });
};

var isolinesDissolvedTpl = Node.template([
    'WITH isolines_query AS ({{=it._isolinesQuery}})',
    'SELECT',
    '  data_range,',
    '  ST_Union(the_geom) AS the_geom',
    'FROM isolines_query',
    'GROUP BY data_range',
    'ORDER BY data_range desc'
].join('\n'));

Buffer.prototype.isolinesDissolvedQuery = function() {
    var _columns = [
        'the_geom AS center',
        isolineGeomTpl({ _radius: this.radius, _isolines: this.isolines }),
        isolineDataRangeTpl({ _radius: this.radius, _isolines: this.isolines })
    ];
    return isolinesDissolvedTpl({
        _isolinesQuery: isolinesQueryTpl({
            _columns: _columns.join(','),
            _isolines: this.isolines,
            _query: this.source.getQuery()
        }),
        _columns: _columns.join(','),
        _isolines: this.isolines,
        _query: this.source.getQuery()
    });
};
