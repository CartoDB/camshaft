'use strict';

var async = require('async');

var id = require('../util/id');

var TYPE = 'point-in-polygon';

function PointInPolygon(pointsNode, polygonsNode) {
    this.pointsNode = pointsNode;
    this.polygonsNode = polygonsNode;
}

module.exports = PointInPolygon;
module.exports.TYPE = TYPE;
module.exports.create = function(definition, factory, databaseService, callback) {
    var sources = [definition.params.pointsSource, definition.params.polygonsSource];
    async.map(sources, factory.create.bind(factory), function(err, results) {
        if (err) {
            return callback(err);
        }

        return callback(null, new PointInPolygon(results[0], results[1]));
    });
};



// ------------------------------ PUBLIC API ------------------------------ //

PointInPolygon.prototype.id = function() {
    return id(this.toJSON());
};

PointInPolygon.prototype.getQuery = function() {
    return 'select * from ' + this.getTargetTable();
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
