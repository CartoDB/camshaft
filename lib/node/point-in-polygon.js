'use strict';

var async = require('async');
var dot = require('dot');
dot.templateSettings.strip = false;

var id = require('../util/id');

var queryTemplate = dot.template([
    '{{ var pointsColumns = it.columnNames.map(function(name) { return "points." + name; }).join(", "); }}',
    'SELECT {{=pointsColumns}}',
    'FROM',
    '({{=it.pointsQuery}}) points',
    'JOIN',
    '({{=it.polygonsQuery}}) polygons',
    'ON ST_Contains(polygons.the_geom, points.the_geom)'
].join('\n'));

var TYPE = 'point-in-polygon';

function PointInPolygon(pointsNode, polygonsNode, columns) {
    this.pointsNode = pointsNode;
    this.polygonsNode = polygonsNode;

    this.columns = columns;
}

module.exports = PointInPolygon;
module.exports.TYPE = TYPE;
module.exports.create = function(definition, factory, databaseService, callback) {
    var sources = [definition.params.pointsSource, definition.params.polygonsSource];
    async.map(sources, factory.create.bind(factory), function(err, results) {
        if (err) {
            return callback(err);
        }

        var pointsNode = results[0];
        var polygonsNode = results[1];


        databaseService.getSchema(pointsNode.getQuery(), function(err, columns) {
            if (err) {
                return callback(err);
            }

            var columnNames = columns
                .map(function(column) {
                    return column.name
                })
                .filter(function(columnName) {
                    return columnName !== 'the_geom_webmercator';
                });

            return callback(null, new PointInPolygon(pointsNode, polygonsNode, columnNames));
        });

    });
};



// ------------------------------ PUBLIC API ------------------------------ //

PointInPolygon.prototype.id = function() {
    return id(this.toJSON());
};

PointInPolygon.prototype.getQuery = function() {
    return queryTemplate({
        pointsQuery: this.pointsNode.getQuery(),
        polygonsQuery: this.polygonsNode.getQuery(),
        columnNames: this.columns
    });
};

PointInPolygon.prototype.getInputNodes = function() {
    return [this.pointsNode, this.polygonsNode];
};

PointInPolygon.prototype.toJSON = function() {
    return {
        type: TYPE,
        pointsNodeId: this.pointsNode.id(),
        polygonsNodeNodeId: this.polygonsNode.id()
    };
};

PointInPolygon.prototype.toDot = function() {
    return {
        type: TYPE,
        color: 'red',
        nodes: {
            pointsNode: this.pointsNode,
            polygonsNodeNode: this.polygonsNode
        },
        attrs: {}
    };
};

// ---------------------------- END PUBLIC API ---------------------------- //

PointInPolygon.prototype.getTargetTable = function() {
    return 'analysis_point_in_polygon_' + this.id();
};
