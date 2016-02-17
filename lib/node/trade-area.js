'use strict';

var id = require('../util/id');

var debug = require('../util/debug')('trade-area');

var TYPE = 'trade-area';

function TradeArea(inputNode, kind, time) {
    this.inputNode = inputNode;
    this.kind = kind; // walk, drive, bike
    this.time = time; // in seconds
}

module.exports.TYPE = TYPE;
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

        var tradeArea = new TradeArea(node, kind, time);

        createCacheTable(databaseService, node.getQuery(), tradeArea.getTargetTable(), kind, time, function(err) {
            if (err) {
                return callback(err);
            }

            return callback(null, tradeArea);
        });
    });
};

// ------------------------------ PUBLIC API ------------------------------ //

TradeArea.prototype.id = function() {
    return id(this.toJSON());
};

TradeArea.prototype.getQuery = function() {
    return 'select * from ' + this.getTargetTable();
};

TradeArea.prototype.getInputNodes = function() {
    return [this.inputNode];
};

TradeArea.prototype.getCacheTables = function() {
    return [this.getTargetTable()];
};

TradeArea.prototype.getAffectedTables = function() {
    return [];
};

TradeArea.prototype.toJSON = function() {
    return {
        type: TYPE,
        inputNodeId: this.inputNode.id(),
        kind: this.kind,
        time: this.time
    };
};

TradeArea.prototype.toDot = function() {
    return {
        type: TYPE,
        color: 'red',
        nodes: {
            inputNode: this.inputNode
        },
        attrs: {
            kind: this.kind,
            time: this.time
        }
    };
};

// ---------------------------- END PUBLIC API ---------------------------- //

TradeArea.prototype.getTargetTable = function() {
    return 'analysis_trade_area_' + this.id();
};


var SKIP_COLUMNS = {
    'the_geom': true,
    'the_geom_webmercator': true
};

function columnNames(columns) {
    return columns
        .map(function(column) { return column.name; })
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

function analysisQuery(inputQuery, columns, kind, time) {
    var distance = fakeTradeAreaDistanceFrom(kind, time);
    debug('For kind=%s, time=%d => distance=%d', kind, time, distance);
    return [
        'SELECT ST_Buffer(the_geom::geography, ' + distance + ')::geometry the_geom,',
        columnNames(columns).join(','),
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
        databaseService.getSchema(inputQuery, function(err, columns) {
            if (err) {
                return callback(err);
            }

            var outputQuery = analysisQuery(inputQuery, columns, kind, time);

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
