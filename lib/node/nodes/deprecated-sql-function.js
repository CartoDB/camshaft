'use strict';

var Node = require('../node');
var queries = require('../../postgresql/queries');

var TYPE = 'deprecated-sql-function';

var PARAMS = {
    function_name: Node.PARAM.STRING(),
    primary_source: Node.PARAM.NODE(Node.GEOMETRY.ANY),
    secondary_source: Node.PARAM.NULLABLE(Node.PARAM.NODE(Node.GEOMETRY.ANY)),
    function_args: Node.PARAM.NULLABLE(Node.PARAM.ARRAY())
};

var DeprecatedSqlFunction = Node.create(TYPE, PARAMS, {
    cache: true,
    beforeCreate: function () {
        if (!this.function_name.match(/^DEP_EXT_/)) {
            throw new Error('Invalid "function_name" param: it must start with `DEP_EXT_`');
        }
    },
    validators: [
        new Node.Validator.Schema([
            { name: 'cartodb_id', type: 'number' },
            { name: 'the_geom', type: 'geometry' }
        ])
    ]
});

module.exports = DeprecatedSqlFunction;

var postgresFunctionTemplate = Node.template([
    'SELECT * FROM {{=it.fnName}}(',
    '    $operation${{=it.operation}}$operation$,', // eslint-disable-line no-template-curly-in-string
    '    $tableName${{=it.tableName}}$tableName$,', // eslint-disable-line no-template-curly-in-string
    '    $primaryQuery${{=it.primarySourceQuery}}$primaryQuery$,', // eslint-disable-line no-template-curly-in-string
    '    {{=it.primarySourceColumns}}',
    '{{? it.secondarySource }}',
    '    ,$secondaryQuery${{=it.secondarySourceQuery}}$secondaryQuery$,', // eslint-disable-line no-template-curly-in-string
    '    {{=it.secondarySourceColumns}}',
    '{{?}}',
    '{{? it.fnExtraArgs !== null}}',
    '    ,{{=it.fnExtraArgs}}',
    '{{?}}',
    ')'
].join('\n'));

DeprecatedSqlFunction.prototype.sql = function () {
    return 'SELECT * FROM ' + this.getTargetTable();
};

DeprecatedSqlFunction.prototype.createTableSql = function () {
    return this.tableSql('create');
};

DeprecatedSqlFunction.prototype.populateTableSql = function () {
    return this.tableSql('populate');
};

DeprecatedSqlFunction.prototype.tableSql = function (operation) {
    var functionArgs = (Array.isArray(this.function_args) && this.function_args.length > 0)
        ? wrapFnArgs(this.function_args).join(',')
        : null;

    var templateParams = {
        fnName: this.function_name,
        primarySourceQuery: this.primary_source.getQuery(),
        primarySourceColumns: columnsAsArray(this.primary_source.getColumns()),
        fnExtraArgs: functionArgs,
        tableName: this.getTargetTable(),
        operation: operation
    };

    if (this.secondary_source !== null) {
        templateParams.secondarySource = true;
        templateParams.secondarySourceQuery = this.secondary_source.getQuery();
        templateParams.secondarySourceColumns = columnsAsArray(this.secondary_source.getColumns());
    }

    return postgresFunctionTemplate(templateParams);
};

function columnsAsArray (columnNames) {
    return queries.pgArray(columnNames.map(queries.pgQuoteCastMapper('text')), 'text');
}

function wrapFnArgs (fnArgs) {
    return fnArgs.map(function (arg, index) {
        return (Number.isFinite(arg) || (typeof arg === 'boolean'))
            ? arg
            : '$arg' + index + '$' + arg + '$arg' + index + '$';
    });
}
