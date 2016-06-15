'use strict';

var util = require('util');
var templateLoader = require('../util/template-loader');
var id = require('../util/id');

var QueryBuilder = require('../filter/query-builder');

var Validator = require('./validator');

var TYPE = require('./type');
module.exports.TYPE = TYPE;
var GEOMETRY = require('./geometry');
module.exports.GEOMETRY = GEOMETRY;

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


var NODE_RESERVED_KEYWORDS = {
    type: 1,
    params: 1,
    status: 1,
    filters: 1,
    schema: 1,
    columns: 1,
    cacheQuery: 1,
    updatedAt: 1,
    validateAndBuild: 1,
    json: 1,
    version: 1,
    nodes: 1,
    inputNodes: 1,
    attrs: 1,
    setStatusFromInputNodes: 1
};

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

    this.schema = {};
    this.columns = [];

    this.nodes = {};
    this.inputNodes = [];

    this.updatedAt = null;

    this.attrs = {};

    this.json = {};

    this.version = 0;
}

Node.prototype.id = function() {
    var json = this.toJSON();
    if (this.version > 0) {
        json = {
            version: this.version,
            json: json
        };
    }
    return id(json);
};

Node.prototype.getQuery = function(applyFilters) {
    var query = this.sql();
    if (this.shouldCacheQuery()) {
        query = 'select * from ' + this.getTargetTable();
    }
    return QueryBuilder.getSql(query, this.filters, applyFilters, this.schema);
};

Node.prototype.getColumns = function(skipTheGeoms) {
    skipTheGeoms = skipTheGeoms || false;
    return (skipTheGeoms) ? skipColumns(this.columns) : this.columns;
};

Node.prototype.getFilters = function() {
    return this.filters;
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
    this.schema = columns.reduce(function(schema, column) {
        schema[column.name] = column.type;
        return schema;
    }, {});
    this.setColumnsNames(columns.map(function(column) {
        return column.name;
    }));
};

Node.prototype.setColumnsNames = function(columnNames) {
    this.columns = columnNames;
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
    }, STATUS.PENDING);
};

Node.prototype.getInputNodes = function() {
    return this.inputNodes;
};

Node.prototype.shouldCacheQuery = function() {
    return this.cacheQuery;
};

Node.prototype.ignoreParamForId = function(paramName) {
    delete this.json[paramName];
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

module.exports.PARAM = {
    NODE: function() {
        var args = (arguments.length === 1 ? [arguments[0]] : Array.apply(null, arguments));
        return new Validator.Node(args);
    },
    NUMBER: function() {
        return new Validator.Generic(TYPE.NUMBER, Number.isFinite);
    },
    STRING: function() {
        return new Validator.Generic(TYPE.STRING, function (str) {
            return typeof str === 'string';
        });
    },
    BOOLEAN: function() {
        return new Validator.Generic(TYPE.BOOLEAN, function (bool) {
            return typeof bool === 'boolean';
        });
    },
    ENUM: function() {
        var args = (arguments.length === 1 ? [arguments[0]] : Array.apply(null, arguments));
        return new Validator.Enum(args);
    },
    ARRAY: function (validator) {
        if (validator) {
            return new Validator.Generic(TYPE.ARRAY, function(arr) {
                return Array.isArray(arr) && arr.every(validator.isValid);
            }, false, TYPE.ARRAY + '<' + validator.type + '>');
        }
        return new Validator.Generic(TYPE.ARRAY, Array.isArray);
    },
    NULLABLE: function (validator, defaultValue) {
        defaultValue = typeof defaultValue !== 'undefined' ? defaultValue : validator.getDefaultValue();
        return new Validator.Generic(validator.type, function(param) {
            return (param === null || typeof param === 'undefined') || validator.isValid(param);
        }, true, validator.expects, defaultValue, validator.toJSON.bind(validator));
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

module.exports.getSqlTemplateFn = function(templateName) {
    return templateLoader.getTemplateFn(__dirname + '/nodes/sql/' + templateName + '.sql');
};

module.exports.create = function createNode(type, expectedParams, options) {
    Object.keys(expectedParams).forEach(function(expectedParamName) {
        if (NODE_RESERVED_KEYWORDS.hasOwnProperty(expectedParamName)) {
            throw new Error('Invalid param name "' + expectedParamName + '". It is a reserved keyword.');
        }
    });

    options = options || {};
    function BaseNode() {
        Node.apply(this, arguments);
        this.type = type;
        this.cacheQuery = options.cache || false;
        this.validateAndBuild();
        if (Number.isFinite(options.version) && options.version > 0) {
            this.version = options.version;
        }
        // `beforeCreate` allows to change/modify the node before it's actually created/returned
        // if it throws an error it will fail to create the node.
        if (options.beforeCreate) {
            options.beforeCreate(this);
        }
    }
    util.inherits(BaseNode, Node);
    BaseNode.prototype.validateAndBuild = function() {
        this.json.type = this.type;
        Object.keys(expectedParams).forEach(function(expectedParamName) {
            var param = this.params[expectedParamName];
            var validator = expectedParams[expectedParamName];

            if (!validator.nullable && !this.params.hasOwnProperty(expectedParamName)) {
                throw new Error('Missing required param "' + expectedParamName + '"');
            }

            if (!validator.isValid(param)) {
                throw new Error(
                    'Invalid type for param "' + expectedParamName + '",' +
                        ' expects "' + validator.expects + '" type,' +
                        ' got `' + JSON.stringify(param) + '`'
                );
            }

            var value = (param === null || typeof param === 'undefined') ? validator.getDefaultValue() : param;

            this[expectedParamName] = value;
            if (validator.type === TYPE.NODE) {
                this.nodes[expectedParamName] = param;
                this.inputNodes.push(param);
                this.json[expectedParamName] = param.id();
            } else {
                this.attrs[expectedParamName] = value;
                this.json[expectedParamName] = value;
            }
        }.bind(this));
        if (Object.keys(this.filters).length > 0) {
            this.json.filters = this.filters;
        }

        this.setStatusFromInputNodes();
    };
    return BaseNode;
};
