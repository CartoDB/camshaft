'use strict';

var Node = require('../node');

var TYPE = 'deprecated-sql-function';

var PARAMS = {
    function_name: Node.PARAM.STRING(),
    primary_source: Node.PARAM.NODE(Node.GEOMETRY.ANY),
    secondary_source: Node.PARAM.NULLABLE(Node.PARAM.NODE(Node.GEOMETRY.ANY)),
    function_args: Node.PARAM.NULLABLE(Node.PARAM.ARRAY())
};

var DeprecatedSqlFunction = Node.create(TYPE, PARAMS, { cache: true });

module.exports = DeprecatedSqlFunction;

var postgresFunctionTemplate = Node.template([
    'SELECT * FROM {{=it.fnName}}(',
    '    $primaryQuery${{=it.primarySourceQuery}}$primaryQuery$,',
    '    {{? it.secondarySourceQuery !== null}}$secondaryQuery${{=it.secondarySourceQuery}}$secondaryQuery$,{{?}}',
    '    {{? it.fnExtraArgs !== null}}{{=it.fnExtraArgs}},{{?}}',
    '    $tableName${{=it.tableName}}$tableName$,',
    '    $operation${{=it.operation}}$operation$',
    ')'
].join('\n'));

DeprecatedSqlFunction.prototype.sql = function() {
    return 'SELECT * FROM ' + this.getTargetTable();
};

DeprecatedSqlFunction.prototype.createTableSql = function() {
    return this.tableSql('create');
};

DeprecatedSqlFunction.prototype.populateTableSql = function() {
    return this.tableSql('populate');
};

DeprecatedSqlFunction.prototype.tableSql = function(operation) {
    var functionArgs = this.function_args === null ? null :
        this.function_args
            .map(function(arg, index) {
                return Number.isFinite(arg) ? arg : '$arg' + index + '$' + arg + '$arg' + index + '$';
            })
            .join(',');

    return postgresFunctionTemplate({
        fnName: this.function_name,
        primarySourceQuery: this.primary_source.getQuery(),
        secondarySourceQuery: (this.secondary_source !== null ? this.secondary_source.getQuery() : null),
        fnExtraArgs: functionArgs,
        tableName: this.getTargetTable(),
        operation: operation
    });
};
