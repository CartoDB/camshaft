'use strict';

var Node = require('../node');
var Checks = require('../../limits/checks');
var debug = require('../../util/debug')('analysis:line-source-to-target');

var closestLineToLayerQueryTemplate = Node.getSqlTemplateFn('line-source-to-target-closest');
var lineToLayerQueryTemplate = Node.getSqlTemplateFn('line-source-to-target');

var SOURCE_ALIAS = '_cdb_analysis_source';
var TARGET_ALIAS = '_cdb_analysis_target';

var TYPE = 'line-source-to-target';
var PARAMS = {
    source: Node.PARAM.NODE(Node.GEOMETRY.POINT),
    source_column: Node.PARAM.NULLABLE(Node.PARAM.STRING()),
    target: Node.PARAM.NODE(Node.GEOMETRY.POINT),
    target_column: Node.PARAM.NULLABLE(Node.PARAM.STRING()),
    closest: Node.PARAM.BOOLEAN()
};
var LIMITS = {
    maximumNumberOfRows: {
        default: 1e6,
        message: 'too many result lines'
    }
};
var LIMITS_CLOSEST = {
    maximumNumberOfRows: {
        default: null,
        message: 'too many result lines'
    }
};

var LineSourceToTarget = Node.create(TYPE, PARAMS, {
    version: 2,
    cache: true,
    beforeCreate: function (node) {
        if (!node.source_column && node.target_column) {
            throw new Error('Missing param `source_column`');
        }

        if (node.source_column && !node.target_column) {
            throw new Error('Missing param `target_column`');
        }
    }
});

module.exports = LineSourceToTarget;

LineSourceToTarget.prototype.sql = function() {
    var sql;
    var skipGeoms = true;
    var templateContext = {
        source: this.source.getQuery(),
        source_column: this.source_column,
        source_alias: SOURCE_ALIAS,
        source_columns: this.source.getColumns(skipGeoms).map(function (column) {
            return SOURCE_ALIAS + '.' + column;
        }).join(', '),
        target: this.target.getQuery(),
        target_column: this.target_column,
        target_alias: TARGET_ALIAS
    };

    if (this.closest) {
        sql = closestLineToLayerQueryTemplate(templateContext);
    } else {
        sql = lineToLayerQueryTemplate(templateContext);
    }

    debug(sql);

    return sql;
};

LineSourceToTarget.prototype.checkLimits = function(context, callback) {
    var limits = this.closest ? LIMITS_CLOSEST : LIMITS;

    Checks.check(this, context, [{
        checker: Checks.limitNumberOfRows,
        limits: limits
    }], callback);
};
