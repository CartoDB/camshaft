'use strict';

var PSQL = require('cartodb-psql');

var debug = require('../util/debug')('query-runner');

function PgQueryRunner(dbParams) {
    this.dbParams = dbParams;
}

module.exports = PgQueryRunner;

PgQueryRunner.prototype.run = function(query, readonly, callback) {
    if (!callback) {
        callback = readonly;
        readonly = true;
    }

    var psql = new PSQL(this.dbParams);

    debug('Running [WRITE=%s] query="%s" with params=%j', !readonly, query, this.dbParams);

    psql.query(query, function(err, resultSet) {
        resultSet = resultSet || {};
        if (resultSet.fields) {
            resultSet.fields.forEach(function(field) {
                var cname = psql.typeName(field.dataTypeID);
                var typeName;
                if ( ! cname ) {
                    typeName = 'unknown(' + field.dataTypeID + ')';
                } else {
                    typeName = getTypeName(cname);
                }
                field.type = typeName;
            });
        }
        return callback(err, resultSet);
    }, readonly);
};

function getTypeName(cname) {
    var tname = cname;

    if ( cname.match('bool') ) {
        tname = 'boolean';
    }
    else if ( cname.match(/int|float|numeric/) ) {
        tname = 'number';
    }
    else if ( cname.match(/text|char|unknown/) ) {
        tname = 'string';
    }
    else if ( cname.match(/date|time/) ) {
        tname = 'date';
    }

    if ( tname && cname.match(/^_/) ) {
        tname += '[]';
    }

    return tname;
}