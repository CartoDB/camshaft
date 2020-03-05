
'use strict';

var util = require('util');
const path = require('path');

var templateLoader = require('../util/template-loader');
var dot = require('dot');
dot.templateSettings.strip = false;

var utilId = require('../util/id');
var QueryBuilder = require('../filter/query-builder');
var Validator = require('./validator');
module.exports.Validator = Validator;
var limits = require('./limits');

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
    typeSignature: 1,
    params: 1,
    status: 1,
    errorMessage: 1,
    filters: 1,
    owner: 1,
    schema: 1,
    columns: 1,
    cacheQuery: 1,
    cacheQueryTimeout: 1,
    queuedWork: 1,
    lazy: 1,
    updatedAt: 1,
    validateAndBuild: 1,
    json: 1,
    attributesForId: 1,
    version: 1,
    nodes: 1,
    inputNodes: 1,
    attrs: 1,
    tags: 1,
    setStatusFromInputNodes: 1,
    affectedTables: 1
};

function Node () {
    // args will look like ['owner', {param1: '', param2: ''}, {param1: '', param3: ''}, ...]
    var args = (arguments.length === 1 ? [arguments[0]] : Array.apply(null, arguments));
    this.owner = args.shift();

    this.params = args.reduce(function (reducedParams, arg) {
        Object.keys(arg).forEach(function (paramName) {
            reducedParams[paramName] = arg[paramName];
        });
        return reducedParams;
    }, {});

    this.status = STATUS.PENDING;
    this.errorMessage = null;
    this.queuedWork = false;
    this.cacheQueryTimeout = 0;

    this.filters = this.params.filters || {};

    this.schema = {};
    this.columns = [];

    this.nodes = {};
    this.inputNodes = [];

    this.updatedAt = null;
    this.affectedTables = [];

    this.attrs = {};

    this.json = {};
    this.attributesForId = [];

    this.typeSignature = null;

    this.version = 0;
}

Node.prototype.id = function (skipFilters) {
    var attrsToSkip = {};
    if (skipFilters || false) {
        attrsToSkip.filters = true;
    }

    var json = Object.keys(this.json).reduce(function (json, paramName) {
        if (!Object.prototype.hasOwnProperty.call(attrsToSkip, paramName)) {
            json[paramName] = this.json[paramName];
        }
        return json;
    }.bind(this), {});

    return utilId.id({
        // Internal version.
        // Bump this for backwards incompatible changes.
        __version__: 1,
        owner: this.owner,
        json: json,
        version: this.version,
        attrs: this.attributesForId.map(function (attr) {
            return Object.prototype.hasOwnProperty.call(this, attr) ? this[attr] : attr;
        }.bind(this))
    });
};

Node.prototype.cachedNodeId = function () {
    return this.shouldCacheQuery() ? this.id(true) : this.id();
};

Node.prototype.setAttributeToModifyId = function (attr) {
    this.attributesForId.push(attr);
};

Node.prototype.getQuery = function (applyFilters) {
    var query = this.sql();
    if (this.shouldCacheQuery()) {
        query = 'select * from ' + this.getTargetTable();
    }
    if (applyFilters === false) {
        applyFilters = Object.keys(this.filters).reduce(function (skipAllFilters, filterName) {
            skipAllFilters[filterName] = false;
            return skipAllFilters;
        }, {});
    }
    return QueryBuilder.getSql(query, this.filters, applyFilters, this.schema);
};

Node.prototype.getColumns = function ({ ignoreGeomColumns = false, ignoredExtraColumns = [] } = {}) {
    const ignoredColumns = (ignoreGeomColumns ? ['the_geom', 'the_geom_webmercator'] : []).concat(ignoredExtraColumns);
    return skipColumns(this.columns, ignoredColumns).map(col => `"${col.replace('"', '""')}"`);
};

Node.prototype.getFilters = function () {
    return this.filters;
};

Node.prototype.getOwner = function () {
    return this.owner;
};

Node.prototype.getType = function () {
    return this.type;
};

Node.prototype.getTypeSignature = function () {
    if (this.typeSignature === null) {
        this.typeSignature = utilId.id(this.getType()).substring(0, 10);
    }
    return this.typeSignature;
};

function stripQuotes (columnName) {
    const quotedName = columnName.length > 2 && columnName[0] === '"' && columnName[columnName.length - 1] === '"';
    if (quotedName) {
        return columnName.substring(1, columnName.length - 1);
    }
    return columnName;
}

function skipColumns (columnNames, ignoredColumns = []) {
    return columnNames.filter(columnName => !ignoredColumns.includes(stripQuotes(columnName)));
}

Node.prototype.setColumns = function (columns) {
    this.schema = columns.reduce(function (schema, column) {
        schema[column.name] = column.type;
        return schema;
    }, {});
    this.setColumnsNames(columns.map(function (column) {
        return column.name;
    }));
};

Node.prototype.setColumnsNames = function (columnNames) {
    this.columns = columnNames;
};

Node.prototype.getStatus = function () {
    return this.status;
};

var VALID_STATUS = Object.keys(STATUS).reduce(function (valid, key) {
    valid[STATUS[key]] = true;
    return valid;
}, {});

Node.prototype.setStatus = function (status) {
    if (!Object.prototype.hasOwnProperty.call(VALID_STATUS, status)) {
        return false;
    }
    this.status = status;
};

Node.prototype.isValid = function (errors) {
    errors = errors || [];
    return this.validators.reduce(function (isValid, validator) {
        return isValid && validator.isValid(this, errors);
    }.bind(this), true);
};

Node.prototype.getErrorMessage = function () {
    return this.errorMessage;
};

Node.prototype.setErrorMessage = function (errorMessage) {
    this.errorMessage = errorMessage;
};

Node.prototype.getUpdatedAt = function () {
    return this.updatedAt;
};

Node.prototype.setUpdatedAt = function (updatedAt) {
    this.updatedAt = (updatedAt === null) ? null : new Date(updatedAt);
};

Node.prototype.getAffectedTables = function () {
    return this.affectedTables;
};

Node.prototype.addAffectedTables = function (affectedTables) {
    var tables = affectedTables;
    this.affectedTables = this.affectedTables.concat(tables);
};

Node.prototype.getLastUpdatedAtFromInputNodes = function () {
    if (this.getInputNodes().length === 0) {
        return this.getUpdatedAt();
    }

    return this.getInputNodes().reduce(function (lastUpdatedAt, inputNode) {
        var inputNodeUpdatedAt = inputNode.getLastUpdatedAtFromInputNodes();
        if (lastUpdatedAt === null) {
            lastUpdatedAt = inputNodeUpdatedAt;
        }

        if (lastUpdatedAt !== null &&
            inputNodeUpdatedAt !== null &&
            inputNodeUpdatedAt.getTime() > lastUpdatedAt.getTime()) {
            lastUpdatedAt = inputNodeUpdatedAt;
        }

        return lastUpdatedAt;
    }, null);
};

Node.prototype.isOutdated = function () {
    var lastUpdatedAtFromInputNodes = this.getLastUpdatedAtFromInputNodes();
    var updatedAt = this.getUpdatedAt();
    return updatedAt === null || lastUpdatedAtFromInputNodes === null ||
        (lastUpdatedAtFromInputNodes.getTime() > updatedAt.getTime());
};

function shouldBeInWaitingStatus (inputNodeStatus) {
    return inputNodeStatus === STATUS.PENDING || inputNodeStatus === STATUS.RUNNING;
}
Node.prototype.setStatusFromInputNodes = function () {
    var shouldCacheNode = this.shouldCacheQuery();
    this.status = this.getInputNodes().reduce(function (currentNodeStatus, node) {
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

Node.prototype.getInputNodes = function () {
    return this.inputNodes;
};

Node.prototype.getAllInputNodes = function (filterFn) {
    filterFn = filterFn || function () { return true; };
    var inputNodes = _getAllInputNodes(this, {});
    return Object.keys(inputNodes).map(function (nodeId) {
        return inputNodes[nodeId];
    }).filter(filterFn);
};

function _getAllInputNodes (node, nodeList) {
    node.getInputNodes().forEach(function (inputNode) {
        nodeList[inputNode.id()] = inputNode;
        _getAllInputNodes(inputNode, nodeList);
    });
    return nodeList;
}

Node.prototype.shouldCacheQuery = function () {
    return this.cacheQuery;
};

Node.prototype.setQueuedWork = function (queuedWork) {
    this.queuedWork = queuedWork;
};

Node.prototype.didQueueWork = function () {
    return this.queuedWork;
};

Node.prototype.getCacheQueryTimeout = function () {
    return this.cacheQueryTimeout;
};

Node.prototype.setCacheQueryTimeout = function (cacheQueryTimeout) {
    this.cacheQueryTimeout = cacheQueryTimeout;
};

Node.prototype.getTags = function () {
    return this.tags;
};

Node.prototype.ignoreParamForId = function (paramName) {
    delete this.json[paramName];
};

Node.prototype.getTargetTable = function () {
    // Keep name at 60 chars
    // Ref.: https://www.postgresql.org/docs/9.5/static/sql-syntax-lexical.html#SQL-SYNTAX-IDENTIFIERS
    return 'analysis_' + this.getTypeSignature() + '_' + this.cachedNodeId();
};

Node.prototype.createTableSql = function () {
    return null;
};

Node.prototype.populateTableSql = function () {
    return null;
};

Node.prototype.toJSON = function () {
    return this.json;
};

Node.prototype.toDot = function () {
    return {
        type: this.type,
        nodes: this.nodes,
        attrs: this.attrs
    };
};

// ----- hooks ------

Node.prototype.beforeCreate = function () {};

Node.prototype.beforeCreateAsync = function (databaseService, callback) {
    return callback(null);
};

module.exports.PARAM = {
    NODE: function () {
        var args = (arguments.length === 1 ? [arguments[0]] : Array.apply(null, arguments));
        return new Validator.Param.Node(args);
    },
    NUMBER: function () {
        return new Validator.Param.Generic(TYPE.NUMBER, Number.isFinite);
    },
    STRING: function () {
        return new Validator.Param.Generic(TYPE.STRING, function (str) {
            return typeof str === 'string';
        });
    },
    BOOLEAN: function () {
        return new Validator.Param.Generic(TYPE.BOOLEAN, function (bool) {
            return typeof bool === 'boolean';
        });
    },
    ENUM: function () {
        var args = (arguments.length === 1 ? [arguments[0]] : Array.apply(null, arguments));
        return new Validator.Param.Enum(args);
    },
    ARRAY: function (validator) {
        if (validator) {
            return new Validator.Param.Generic(TYPE.ARRAY, function (arr) {
                return Array.isArray(arr) && arr.every(validator.isValid);
            }, false, TYPE.ARRAY + '<' + validator.type + '>');
        }
        return new Validator.Param.Generic(TYPE.ARRAY, Array.isArray);
    },
    NULLABLE: function (validator, defaultValue) {
        defaultValue = typeof defaultValue !== 'undefined' ? defaultValue : validator.getDefaultValue();
        return new Validator.Param.Generic(validator.type, function (param) {
            return (param === null || typeof param === 'undefined') || validator.isValid(param);
        }, true, validator.expects, defaultValue, validator.toJSON.bind(validator));
    }
};

module.exports.getChildNodesNames = function (NodeClass) {
    return Object.keys(NodeClass.PARAMS).reduce(function (childNodesNames, paramName) {
        if (NodeClass.PARAMS[paramName].type === TYPE.NODE) {
            childNodesNames.push(paramName);
        }
        return childNodesNames;
    }, []);
};

module.exports.getSqlTemplateFn = function (templateName) {
    return templateLoader.getTemplateFn(path.join(__dirname, '/nodes/sql/', `${templateName}.sql`));
};

module.exports.template = function (tmpl, c, def) {
    return dot.template(tmpl, c, def);
};

module.exports.create = function createNode (type, expectedParams, options) {
    Object.keys(expectedParams).forEach(function (expectedParamName) {
        if (Object.prototype.hasOwnProperty.call(NODE_RESERVED_KEYWORDS, expectedParamName)) {
            throw new Error('Invalid param name "' + expectedParamName + '". It is a reserved keyword.');
        }
    });

    options = options || {};
    options.cache = options.cache || false;
    options.lazy = options.lazy || false;
    options.tags = options.tags || [];
    if (!Number.isFinite(options.version)) {
        options.version = 0;
    }
    function BaseNode () {
        Node.apply(this, arguments);
        this.type = type;
        this.cacheQuery = options.cache;
        this.lazy = options.lazy;
        this.tags = options.tags;
        if (options.version > 0) {
            this.version = options.version;
        }
        this.validateAndBuild();
        // `beforeCreate` allows to change/modify the node before it's actually created/returned
        // if it throws an error it will fail to create the node.
        if (options.beforeCreate) {
            this.beforeCreate = options.beforeCreate.bind(this);
        }
        this.beforeCreate();
        if (options.beforeCreateAsync) {
            this.beforeCreateAsync = options.beforeCreateAsync.bind(this);
        }
        this.validators = Array.isArray(options.validators) ? options.validators : [];
    }
    util.inherits(BaseNode, Node);
    BaseNode.prototype.validateAndBuild = function () {
        this.json.type = this.type;
        Object.keys(expectedParams).forEach(function (expectedParamName) {
            var validator = expectedParams[expectedParamName];
            var param = validate(validator, this.params, expectedParamName);
            var value = (param === null || typeof param === 'undefined') ? validator.getDefaultValue() : param;

            this[expectedParamName] = value;
            if (validator.type === TYPE.NODE && !!value) {
                var parentNode = param;
                this.nodes[expectedParamName] = parentNode;
                this.inputNodes.push(parentNode);
                var skipFilters = this.lazy;
                this.json[expectedParamName] = parentNode.id(skipFilters);

                if (this.lazy) {
                    this.filters = this.filters || {};
                    var parentNodeFilters = parentNode.getFilters();
                    Object.keys(parentNodeFilters).forEach(function (filterName) {
                        this.filters['__p__' + filterName] = parentNodeFilters[filterName];
                    }.bind(this));
                }
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
    BaseNode.TYPE = type;
    BaseNode.PARAMS = expectedParams;
    BaseNode.OPTIONS = {
        version: options.version,
        cache: options.cache,
        lazy: options.lazy
    };
    return BaseNode;
};

function validate (validator, params, expectedParamName) {
    if (!validator.nullable && !Object.prototype.hasOwnProperty.call(params, expectedParamName)) {
        throw new Error('Missing required param "' + expectedParamName + '"');
    }

    var param = params[expectedParamName];

    if (!validator.isValid(param)) {
        throw new Error(
            'Invalid type for param "' + expectedParamName + '",' +
            ' expects "' + validator.expects + '" type,' +
            ' got `' + JSON.stringify(param) + '`'
        );
    }

    return param;
}

Node.prototype.checkLimits = function (context, callback) {
    // the default is to limit number of output rows if a maximumNumberOfRows is
    // present in the configuration (not by default)
    var defaultLimit = null;
    var limit = context.getLimit(this.getType(), 'maximumNumberOfRows', defaultLimit, 'too many result rows');
    limits.limitNumberOfRows(this, context, limit, callback);
};
