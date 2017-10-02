'use strict';

var dot = require('dot');
dot.templateSettings.strip = false;

var betweenFilterTpl = dot.template('{{=it._column}} BETWEEN {{=it._min}} AND {{=it._max}}');
var minFilterTpl = dot.template('{{=it._column}} > {{=it._min}}');
var minOrEqualFilterTpl = dot.template('{{=it._column}} >= {{=it._min}}');
var maxFilterTpl = dot.template('{{=it._column}} < {{=it._max}}');
var maxOrEqualFilterTpl = dot.template('{{=it._column}} <= {{=it._max}}');
var filterQueryTpl = dot.template('SELECT * FROM ({{=it._sql}}) _camshaft_range_filter WHERE {{=it._filter}}');
var dateColumnTpl = dot.template('date_part(\'epoch\', {{=it._column}})');

function Range(column, filterParams) {
    this.column = column.name;
    this.columnType = column.type;

    if (!Number.isFinite(filterParams.min_or_equal) &&
        !Number.isFinite(filterParams.max_or_equal) &&
        !Number.isFinite(filterParams.min) &&
        !Number.isFinite(filterParams.max)) {
        throw new Error('Range filter expect to have at least one value in min_or_equal, max_or_equal, min, or max '+
            'numeric params');
    }

    this.min_or_equal = filterParams.min_or_equal;
    this.max_or_equal = filterParams.max_or_equal;
    this.min = filterParams.min;
    this.max = filterParams.max;
}

module.exports = Range;

Range.prototype.sql = function(rawSql) {
    var _column = this.column;
    if (this.columnType === 'date') {
        _column = dateColumnTpl({ _column: _column });
    }

    var minMaxFilter;
    if (Number.isFinite(this.min) && Number.isFinite(this.max)) {
        minMaxFilter = betweenFilterTpl({
            _column: _column,
            _min: this.min,
            _max: this.max
        });
    } else if (Number.isFinite(this.min_or_equal)) {
        minMaxFilter = minOrEqualFilterTpl({ _column: _column, _min: this.min_or_equal });
    } else if (Number.isFinite(this.max_or_equal)) {
        minMaxFilter = maxOrEqualFilterTpl({ _column: _column, _max: this.max_or_equal });
    } else if (Number.isFinite(this.min)) {
        minMaxFilter = minFilterTpl({ _column: _column, _min: this.min });
    } else {
        minMaxFilter = maxFilterTpl({ _column: _column, _max: this.max });
    }

    return filterQueryTpl({
        _sql: rawSql,
        _filter: minMaxFilter
    });
};
