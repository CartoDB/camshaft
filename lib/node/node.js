'use strict';

var util = require('util');

var id = require('../util/id');
var NotImplemented = require('../error/not-implemented');

function Node() {
    // args will look like [{param1: '', param2: ''}, {param1: '', param3: ''}, ...]
    var args = (arguments.length === 1 ? [arguments[0]] : Array.apply(null, arguments));
    this.params = args.reduce(function(reducedParams, arg) {
        Object.keys(arg).forEach(function(paramName) {
            reducedParams[paramName] = arg[paramName];
        });
        return reducedParams;
    }, {});

    this.columns = [];

    this.nodes = {};
    this.inputNodes = [];

    this.attrs = {};

    this.json = {};

    this.cacheTables = [];
    this.affectedTables = [];
}

Node.prototype.id = function() {
    return id(this.toJSON());
};

Node.prototype.getQuery = function() {
    throw new NotImplemented();
};

Node.prototype.getColumns = function() {
    return this.columns;
};

Node.prototype.setColumns = function(columns) {
    this.columns = columns;
};

Node.prototype.getInputNodes = function() {
    return this.inputNodes;
};

Node.prototype.getCacheTables = function() {
    return this.cacheTables;
};

Node.prototype.getAffectedTables = function() {
    return this.affectedTables;
};

Node.prototype.setAffectedTables = function(affectedTables) {
    this.affectedTables = affectedTables;
};

Node.prototype.toJSON = function() {
    return this.json;
};

Node.prototype.toDot = function() {
    return {
        type: this.type,
        nodes: this.nodes,
        attrs: this.attrs
    };
};


var TYPE = {
    NODE: 'node',
    NUMBER: 'number',
    STRING: 'string',
    BOOLEAN: 'boolean',
    ENUM: 'enum'
};

function Validator(type, isValid) {
    this.type = type;
    this.isValid = isValid;
    this.expects = type;
}

Validator.prototype.toJSON = function() {
    return {
        type: this.type
    };
};

function EnumValidator(validValues) {
    this.type = TYPE.ENUM;
    this.validValues = validValues;
    this.isValid = function(val) {
        return validValues.indexOf(val) > -1;
    };
    this.expects = TYPE.ENUM + '(' + validValues.map(JSON.stringify).join(',') + ')';
}

EnumValidator.prototype.toJSON = function() {
    return {
        type: this.type,
        values: this.validValues
    };
};

module.exports.PARAM = {
    NODE: new Validator(TYPE.NODE, function (node) {
        return !!node.getQuery;
    }),
    NUMBER: new Validator(TYPE.NUMBER, Number.isFinite),
    STRING: new Validator(TYPE.STRING, function (str) {
        return typeof str === 'string';
    }),
    BOOLEAN: new Validator(TYPE.BOOLEAN, function (bool) {
        return typeof bool === 'boolean';
    }),
    ENUM: function() {
        var args = (arguments.length === 1 ? [arguments[0]] : Array.apply(null, arguments));
        return new EnumValidator(args);
    }
};


module.exports.create = function createNode(type, expectedParams) {
    function BaseNode() {
        Node.apply(this, arguments);
        this.type = type;
        this.validateAndBuild();
    }
    util.inherits(BaseNode, Node);
    BaseNode.prototype.validateAndBuild = function() {
        this.json.type = this.type;
        Object.keys(expectedParams).forEach(function(expectedParamName) {
            if (!this.params.hasOwnProperty(expectedParamName)) {
                throw new Error('Missing required param "' + expectedParamName + '"');
            }

            var param = this.params[expectedParamName];
            var validator = expectedParams[expectedParamName];

            if (!validator.isValid(param)) {
                throw new Error(
                    'Invalid type for param "' + expectedParamName + '",' +
                        ' expects "' + validator.expects + '" type,' +
                        ' got `' + JSON.stringify(param) + '`'
                );
            }

            this[expectedParamName] = param;
            if (validator.type === TYPE.NODE) {
                this.nodes[expectedParamName] = param;
                this.inputNodes.push(param);
                this.json[expectedParamName] = param.id();
            } else {
                this.attrs[expectedParamName] = param;
                this.json[expectedParamName] = param;
            }
        }.bind(this));
    };
    return BaseNode;
};
