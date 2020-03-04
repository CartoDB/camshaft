'use strict';

var TYPE = require('../../type');
var GEOMETRY = require('../../geometry');

function NodeValidator (geometry) {
    this.type = TYPE.NODE;
    this.geometry = geometry || [GEOMETRY.ANY];
    this.geometries = this.geometry.reduce(function (geometries, geometry) {
        geometries[geometry] = true;
        return geometries;
    }, {});
    this.isValid = function (node) {
        return !!node && !!node.getQuery;
    };
    this.expects = TYPE.NODE;
    this.defaultValue = null;
}

NodeValidator.prototype.toJSON = function () {
    return {
        type: this.type,
        geometry: this.geometry
    };
};

NodeValidator.prototype.getDefaultValue = function () {
    return this.defaultValue;
};

module.exports = NodeValidator;
