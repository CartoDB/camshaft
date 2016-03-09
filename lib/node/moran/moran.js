'use strict';

var id = require('../../util/id');

var TYPE = 'moran';

// jshint maxparams:8
function Moran(inputNode, numeratorColumn, denominatorColumn, significance, neighbours, permutations, wType, params) {
    this.inputNode = inputNode;

    this.numeratorColumn = numeratorColumn;
    this.denominatorColumn = denominatorColumn;
    this.significance = significance;
    this.neighbours = neighbours;
    this.permutations = permutations;
    this.wType = wType; // knn or queen

    this.columns = [];

    this.params = params || {};
}

module.exports = Moran;
module.exports.TYPE = TYPE;
module.exports.create = require('./factory').create;

// ------------------------------ PUBLIC API ------------------------------ //

Moran.prototype.id = function() {
    return id(this.toJSON());
};

Moran.prototype.getQuery = function() {
    return 'select * from ' + this.getTargetTable();
};

Moran.prototype.getColumns = function() {
    return this.columns;
};

Moran.prototype.getInputNodes = function() {
    return [this.inputNode];
};

Moran.prototype.getCacheTables = function() {
    return [this.getTargetTable()];
};

Moran.prototype.getAffectedTables = function() {
    return [];
};

Moran.prototype.toJSON = function() {
    return {
        type: TYPE,
        inputNodeId: this.inputNode.id(),
        numeratorColumn: this.numeratorColumn,
        denominatorColumn: this.denominatorColumn,
        significance: this.significance,
        neighbours: this.neighbours,
        permutations: this.permutations,
        wType: this.wType
    };
};

Moran.prototype.toDot = function() {
    return {
        type: TYPE,
        color: 'red',
        nodes: {
            inputNode: this.inputNode
        },
        attrs: {
            numeratorColumn: this.numeratorColumn,
            denominatorColumn: this.denominatorColumn,
            significance: this.significance,
            neighbours: this.neighbours,
            permutations: this.permutations,
            wType: this.wType
        }
    };
};

// ---------------------------- END PUBLIC API ---------------------------- //

Moran.prototype.setColumns = function(columns) {
    this.columns = columns;
};

Moran.prototype.getTargetTable = function() {
    return 'analysis_cdb_moran_' + this.id();
};
