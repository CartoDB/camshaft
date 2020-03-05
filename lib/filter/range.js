'use strict';

var dot = require('dot');
dot.templateSettings.strip = false;

var betweenFilterTpl = dot.template('{{=it._column}} BETWEEN {{=it._min}} AND {{=it._max}}');
var lessThanOrEqualFilterTpl = dot.template('{{=it._column}} <= {{=it._max}}');
var greaterThanOrEqualFilterTpl = dot.template('{{=it._column}} >= {{=it._min}}');
var lessThanFilterTpl = dot.template('{{=it._column}} < {{=it._max}}');
var greaterThanFilterTpl = dot.template('{{=it._column}} > {{=it._min}}');

var filterQueryTpl = dot.template('SELECT * FROM ({{=it._sql}}) _camshaft_range_filter WHERE {{=it._filter}}');
var dateColumnTpl = dot.template('date_part(\'epoch\', {{=it._column}})');

function Range (column, filterParams) {
    this.column = column.name;
    this.columnType = column.type;

    if (!Number.isFinite(filterParams.greater_than) &&
        !Number.isFinite(filterParams.greater_than_or_equal) &&
        !Number.isFinite(filterParams.less_than) &&
        !Number.isFinite(filterParams.less_than_or_equal) &&
        !Number.isFinite(filterParams.min) &&
        !Number.isFinite(filterParams.max)) {
        throw new Error('Range filter expect to have at least one value in greater_than, greater_than_or_equal, ' +
                        'less_than, less_than_or_equal, min, or max numeric params');
    }

    this.greater_than = filterParams.greater_than;
    this.greater_than_or_equal = filterParams.greater_than_or_equal || filterParams.min;
    this.less_than = filterParams.less_than;
    this.less_than_or_equal = filterParams.less_than_or_equal || filterParams.max;
}

module.exports = Range;

Range.prototype._getColumn = function () {
    var _column = this.column;

    if (this.columnType === 'date') {
        _column = dateColumnTpl({ _column: _column });
    }

    return _column;
};

Range.prototype.sql = function (rawSql) {
    var _column = this._getColumn();

    var filter;
    if (Number.isFinite(this.greater_than_or_equal) && Number.isFinite(this.less_than_or_equal)) {
        filter = betweenFilterTpl({
            _column: _column,
            _min: this.greater_than_or_equal,
            _max: this.less_than_or_equal
        });
    } else if (Number.isFinite(this.greater_than)) {
        filter = greaterThanFilterTpl({ _column: _column, _min: this.greater_than });
    } else if (Number.isFinite(this.less_than)) {
        filter = lessThanFilterTpl({ _column: _column, _max: this.less_than });
    } else if (Number.isFinite(this.greater_than_or_equal)) {
        filter = greaterThanOrEqualFilterTpl({ _column: _column, _min: this.greater_than_or_equal });
    } else if (Number.isFinite(this.less_than_or_equal)) {
        filter = lessThanOrEqualFilterTpl({ _column: _column, _max: this.less_than_or_equal });
    }

    return filterQueryTpl({
        _sql: rawSql,
        _filter: filter
    });
};
