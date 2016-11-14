'use strict';

var Node = require('../node');
var NodeRequirements = require('../requirements');
var debug = require('../../util/debug')('analysis:line-sequential');

var TYPE = 'line-sequential';
var PARAMS = {
    source: Node.PARAM.NODE(Node.GEOMETRY.POINT),
    order_column:  Node.PARAM.STRING(),
    order_type: Node.PARAM.ENUM('asc', 'desc'),
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

LineSequential.prototype.checkLimits = function(databaseService, limits, callback) {
    var self = this;
    var rowsLimit = NodeRequirements.getNodeLimit(limits, TYPE, 'maximumNumberOfRows', 1000000);
    var pointsLimit = NodeRequirements.getNodeLimit(limits, TYPE, 'maximumNumberOfPointsPerLine', 100000);
    function check(inputRows, numCategories) {
        // we make a rough estimate of numCategories result rows and inputRows/numCategories points per line
        var numberOfRows = numCategories;
        var numberOfPointsPerLine = inputRows/(numCategories || 1);
        var messages = [];
        if (numberOfRows > rowsLimit) {
            messages.push('too many result rows');
        }
        if (numberOfPointsPerLine > pointsLimit) {
            messages.push('too many points per line');
        }
        return callback(self.requirements.errorForMessages(messages));
    }
    this.requirements.estimatedNumberOfInputRows(databaseService, function(err, inputRows) {
        if (databaseService.checkForTimeout(err)) {
            // for time out errors we abort the analysis since the query is probably too complex
            return callback(err);
        } else if (err) {
            // something went wrong... lack of stats? anyway, we'll let the analysis pass
            return callback(null);
        } else {
            var numCategories = 1;
            if (self.category_column) {
                self.source.requirements.numberOfDistinctValues(databaseService, self.category_column,
                    function(err, num) {
                    if (databaseService.checkForTimeout(err)) {
                        return callback(err);
                    } else if (!err) {
                        numCategories = num;
                    }
                    check(inputRows.source, numCategories);
                });
             }
             else {
               check(inputRows.source, numCategories);
             }
        }
    });

};
