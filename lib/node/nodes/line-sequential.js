'use strict';

var Node = require('../node');
var debug = require('../../util/debug')('analysis:line-sequential');

var TYPE = 'line-sequential';
var PARAMS = {
    source: Node.PARAM.NODE(Node.GEOMETRY.POINT),
    order_column:  Node.PARAM.NULLABLE(Node.PARAM.STRING(), 'cartodb_id'),
    order_type: Node.PARAM.NULLABLE(Node.PARAM.ENUM('asc', 'desc'), 'asc'),
    category_column: Node.PARAM.NULLABLE(Node.PARAM.STRING())
};

var LineSequential = Node.create(TYPE, PARAMS);

module.exports = LineSequential;

LineSequential.prototype.sql = function () {
    var sql = routingSequentialQueryTemplate({
        source: this.source.getQuery(),
        order_column:  this.order_column,
        order_type: this.order_type,
        category_column: this.category_column,
    });

    debug(sql);

    return sql;
};

var routingSequentialQueryTemplate = Node.template([
    'SELECT',
    '  row_number() over() AS cartodb_id,',
    '  *,',
    '  ST_Length(the_geom) as length',
    'FROM (',
    '  SELECT',
    '    {{? it.category_column }}{{=it.category_column}} as category,{{?}}',
    '    ST_MakeLine(the_geom ORDER BY {{=it.order_column}} {{=it.order_type}}) AS the_geom',
    '  FROM (',
    '    {{=it.source}}',
    '  ) _line_sequential',
    '  {{? it.category_column }}GROUP BY {{=it.category_column}}{{?}}',
    ') _cdb_analysis_line_sequential'
].join('\n'));

var countDistinctValues = Node.template([
    'SELECT COUNT(*) AS count_distict_values FROM (',
    '  SELECT DISTINCT {{=it.category_column}}',
    '  FROM (',
    '    {{=it.source}}',
    '  ) AS _line_sequential',
    ') AS _cdb_analysis_count_distinct'
].join('\n'));

LineSequential.prototype.computeRequirements = function(databaseService, limits, callback) {
    var inputRows = this.source.estimatedRequirements.numberOfRows;
    var numCategories = 1;
    var self = this;
    var rowsLimit = Node.getNodeLimit(limits, TYPE, 'maximumNumberOfRows', 1000000);
    var pointsLimit = Node.getNodeLimit(limits, TYPE, 'maximumNumberOfPointsPerLine', 10000);
    function storeRequirements(err) {
        // we make a rough estimate of numCategories result rows and inputRows/numCategories points per line
        self.estimatedRequirements = {
            numberOfRows: numCategories,
            numberOfPointsPerLine: inputRows/numCategories
        };
        self.limits = {
            maximumNumberOfRows: rowsLimit,
            maximumNumberOfPointsPerLine: pointsLimit
        };
        return callback(err);
    }
    if (this.category_column) {
        var sql = countDistinctValues({
            source: this.source.getQuery(),
            category_column: this.category_column
        });
        databaseService.run(sql, function(err, resultSet){
            if (databaseService.checkForTimeout(err)) {
                // make the limits check fail, since the query will probably take too much time
                err = null;
                pointsLimit = 0;
            } else if (!err) {
                numCategories = resultSet.rows[0].count_distict_values;
            }
            storeRequirements(err);
        });
    }
    else {
        storeRequirements(null);
    }
};

LineSequential.prototype.requirementMessages = function() {
    var messages = [];
    if (this.estimatedRequirements.numberOfRows > this.limits.maximumNumberOfRows) {
        messages.push('too many result rows');
    }
    if (this.estimatedRequirements.numberOfPointsPerLine > this.limits.maximumNumberOfPointsPerLine) {
        messages.push('too many points per line');
    }
    return messages;
};
