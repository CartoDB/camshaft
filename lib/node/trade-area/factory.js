'use strict';

var TradeArea = require('./trade-area');
var debug = require('../../util/debug')(TradeArea.TYPE);

module.exports.create = function(definition, factory, databaseService, callback) {
    factory.create(definition.params.source, function(err, node) {
        if (err) {
            return callback(err);
        }

        var kind = definition.params.kind || 'walk';
        if (!Number.isFinite(definition.params.time)) {
            return callback('Unexpected "time" param');
        }
        var time = definition.params.time;


        var tradeArea = new TradeArea(node, kind, time, definition.params);

        createCacheTable(databaseService, node.getQuery(), tradeArea.getTargetTable(), kind, time, function(err) {
            if (err) {
                return callback(err);
            }

            databaseService.getColumnNames(node.getQuery(), function(err, columnNames) {
                if (err) {
                    return callback(err);
                }

                tradeArea.setColumns(columnNames);
                return callback(null, tradeArea);
            });
        });
    });
};

var SKIP_COLUMNS = {
    'the_geom': true,
    'the_geom_webmercator': true
};

function skipColumns(columnNames) {
    return columnNames
        .filter(function(columnName) { return !SKIP_COLUMNS[columnName]; });
}

var kmhMap = {
    walk: 5,
    bike: 15,
    drive: 90
};

function fakeTradeAreaDistanceFrom(kind, time) {
    kind = kmhMap.hasOwnProperty(kind) ? kind : 'walk';
    var kmh = kmhMap[kind];
    return (time / 3600) * (kmh * 1e3);
}

function analysisQuery(inputQuery, columnaNames, kind, time) {
    var distance = fakeTradeAreaDistanceFrom(kind, time);
    debug('For kind=%s, time=%d => distance=%d', kind, time, distance);
    return [
            'SELECT ST_Buffer(the_geom::geography, ' + distance + ')::geometry the_geom,',
        skipColumns(columnaNames).join(','),
            'FROM (' + inputQuery + ') _cdb_create_cache_table'
    ].join('\n');
}

function populateCacheTableQuery(targetTableName, outputQuery) {
    return [
            'INSERT INTO ' + targetTableName,
        outputQuery
    ].join('\n');
}

function createCacheTable(databaseService, inputQuery, targetTableName, kind, time, callback) {
    databaseService.run('select * from ' + targetTableName + ' limit 0', function(err) {
        if (!err) {
            return callback(null);
        }

        // if table does not exist, we create it.
        databaseService.getColumnNames(inputQuery, function(err, columnNames) {
            if (err) {
                return callback(err);
            }

            var outputQuery = analysisQuery(inputQuery, columnNames, kind, time);

            databaseService.createTable(targetTableName, outputQuery, function(err) {
                if (err) {
                    return callback(err);
                }
                var populateQuery = populateCacheTableQuery(targetTableName, outputQuery);
                databaseService.enqueue(populateQuery, function(err, result) {
                    return callback(err, result);
                });
            });
        });
    });
}
