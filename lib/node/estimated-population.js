'use strict';

var id = require('../util/id');

var TYPE = 'estimated-population';

function EstimatedPopulation(inputNode) {
    this.inputNode = inputNode;
}

module.exports = EstimatedPopulation;
module.exports.TYPE = TYPE;

module.exports.create = function(definition, factory, databaseService, callback) {
    factory.create(definition.params.source, function(err, node) {
        if (err) {
            return callback(err);
        }

        return callback(null, new EstimatedPopulation(node));
    });
};

// ------------------------------ PUBLIC API ------------------------------ //

EstimatedPopulation.prototype.id = function() {
    return id(this.toJSON());
};

EstimatedPopulation.prototype.getQuery = function() {
    return 'select * from ' + this.getTargetTable();
};

EstimatedPopulation.prototype.getInputNodes = function() {
    return [this.inputNode];
};

EstimatedPopulation.prototype.toJSON = function() {
    return {
        type: TYPE,
        inputNodeId: this.inputNode.id()
    };
};

EstimatedPopulation.prototype.toDot = function() {
    return {
        type: TYPE,
        color: 'red',
        nodes: {
            inputNode: this.inputNode
        },
        attrs: {}
    };
};

// ---------------------------- END PUBLIC API ---------------------------- //

EstimatedPopulation.prototype.getTargetTable = function() {
    return 'analysis_estimated_population_' + this.id();
};
