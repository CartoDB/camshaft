'use strict';

var util = require('util');

var id = require('../util/id');

var QueryBuilder = require('../filter/query-builder');

var STATUS = {
    // transitional status
    PENDING: 'pending',
    WAITING: 'waiting',
    RUNNING: 'running',

    // final status
    FAILED: 'failed',
    READY: 'ready'
};

module.exports.STATUS = STATUS;

function Node() {
    // args will look like [{param1: '', param2: ''}, {param1: '', param3: ''}, ...]
    var args = (arguments.length === 1 ? [arguments[0]] : Array.apply(null, arguments));
    this.params = args.reduce(function(reducedParams, arg) {
        Object.keys(arg).forEach(function(paramName) {
            reducedParams[paramName] = arg[paramName];
        });
        return reducedParams;
    }, {});

    this.status = STATUS.PENDING;

    this.filters = this.params.filters || {};

    this.columns = [];

    this.nodes = {};
    this.inputNodes = [];

    this.updatedAt = null;

    this.attrs = {};

    this.json = {};
}

Node.prototype.id = function() {
    return id(this.toJSON());
};

Node.prototype.getQuery = function(applyFilters) {
    var query = this.sql();
    if (this.shouldCacheQuery()) {
        query = 'select * from ' + this.getTargetTable();
    }
    return QueryBuilder.getSql(query, this.filters, applyFilters);
};

Node.prototype.getColumns = function(skipTheGeoms) {
    skipTheGeoms = skipTheGeoms || false;
    return (skipTheGeoms) ? skipColumns(this.columns) : this.columns;
};

var SKIP_COLUMNS = {
    'the_geom': true,
    'the_geom_webmercator': true
};

function skipColumns(columnNames) {
    return columnNames
        .filter(function(columnName) { return !SKIP_COLUMNS[columnName]; });
}


Node.prototype.setColumns = function(columns) {
    this.columns = columns;
};

Node.prototype.getStatus = function() {
    return this.status;
};

var VALID_STATUS = Object.keys(STATUS).reduce(function(valid, key) {
    valid[STATUS[key]] = true;
    return valid;
}, {});

Node.prototype.setStatus = function(status) {
    if (!VALID_STATUS.hasOwnProperty(status)) {
        return false;
    }
    this.status = status;
};

Node.prototype.getUpdatedAt = function() {
    return this.updatedAt;
};

Node.prototype.setUpdatedAt = function(updatedAt) {
    this.updatedAt = (updatedAt === null) ? null : new Date(updatedAt);
};

function shouldBeInWaitingStatus(inputNodeStatus) {
    return inputNodeStatus === STATUS.PENDING || inputNodeStatus === STATUS.RUNNING;
}
Node.prototype.setStatusFromInputNodes = function() {
    var shouldCacheNode = this.shouldCacheQuery();
    this.status = this.inputNodes.reduce(function(currentNodeStatus, node) {
        if (currentNodeStatus === STATUS.FAILED || currentNodeStatus === STATUS.WAITING) {
            return currentNodeStatus;
        }

        var inputNodeStatus = node.getStatus();

        if (inputNodeStatus === STATUS.FAILED) {
            return STATUS.FAILED;
        }

        if (shouldBeInWaitingStatus(inputNodeStatus)) {
            return STATUS.WAITING;
        }

        return shouldCacheNode ? STATUS.PENDING : STATUS.READY;
    }, this.status);
};

Node.prototype.getInputNodes = function() {
    return this.inputNodes;
};

Node.prototype.shouldCacheQuery = function() {
    return this.cacheQuery;
};

Node.prototype.getTargetTable = function() {
    return 'analysis_' + this.type.replace(/-/g, '_') + '_' + this.id();
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

module.exports.getChildNodesNames = function(NodeClass) {
    return Object.keys(NodeClass.PARAMS).reduce(function(childNodesNames, paramName) {
        if (NodeClass.PARAMS[paramName].type === TYPE.NODE) {
            childNodesNames.push(paramName);
        }
        return childNodesNames;
    }, []);
};

module.exports.create = function createNode(type, expectedParams, options) {
    options = options || {};
    function BaseNode() {
        Node.apply(this, arguments);
        this.type = type;
        this.cacheQuery = options.cache || false;
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
        if (Object.keys(this.filters).length > 0) {
            this.json.filters = this.filters;
        }

        this.setStatusFromInputNodes();
    };
    return BaseNode;
};
