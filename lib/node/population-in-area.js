'use strict';

var id = require('../util/id');

var debug = require('../util/debug')('population-in-area');

var TYPE = 'population-in-area';

function PopulationInArea(inputNode, finalColumn) {
    this.inputNode = inputNode;
    this.finalColumn = finalColumn;
}

module.exports.TYPE = TYPE;
module.exports.create = function(definition, factory, databaseService, callback) {
    factory.create(definition.params.source, function(err, node) {
        if (err) {
            return callback(err);
        }

        var populationInArea = new PopulationInArea(node, definition.params.finalColumn);

        createCacheTable(databaseService, node.getQuery(), populationInArea.getTargetTable(), definition.params.finalColumn, function(err) {
            if (err) {
                return callback(err);
            }
            return callback(null, populationInArea);
        });
    });
};

// ------------------------------ PUBLIC API ------------------------------ //

PopulationInArea.prototype.id = function() {
    return id(this.toJSON());
};

PopulationInArea.prototype.getQuery = function() {
    return 'select * from ' + this.getTargetTable();
};

PopulationInArea.prototype.getInputNodes = function() {
    return [this.inputNode];
};

PopulationInArea.prototype.getCacheTables = function() {
    return [this.getTargetTable()];
};

PopulationInArea.prototype.getAffectedTables = function() {
    return [];
};

PopulationInArea.prototype.toJSON = function() {
    return {
        type: TYPE,
        inputNodeId: this.inputNode.id()
    };
};

PopulationInArea.prototype.toDot = function() {
    return {
        type: TYPE,
        color: 'red',
        nodes: {
            inputNode: this.inputNode
        },
        attrs: {
        }
    };
};

// ---------------------------- END PUBLIC API ---------------------------- //

PopulationInArea.prototype.getTargetTable = function() {
    return 'analysis_population_in_area_3' + this.id();
};


var SKIP_COLUMNS = {
    /*'the_geom': true,
    'the_geom_webmercator': true
    */
};

function columnNames(columns) {
    return columns
        .map(function(column) { return column.name; })
        .filter(function(columnName) { return !SKIP_COLUMNS[columnName]; });
}

function analysisQuery(inputQuery, columns, finalColumn) {
    return [
        'SELECT ',
        "CDB_Population(the_geom) as " + finalColumn + ",",
        columnNames(columns).join(','),
        'FROM (' + inputQuery + ') _cdb_create_cache_table'
    ].join('\n');
}

/*
 * 
CREATE OR REPLACE FUNCTION CDB_Population(geom geometry) RETURNS real AS $$
DECLARE
  c real;
BEGIN
  EXECUTE 'SELECT sum(b.population * ST_Area(ST_Intersection($1, b.the_geom)::geography) / ST_Area(b.the_geom::geography)) FROM barrios_madrid_with_population b where ST_Intersects (b.the_geom, $1)' INTO
 c USING geom;
  RETURN COALESCE(c, 0);
END;
$$ LANGUAGE plpgsql;
*/

function populateCacheTableQuery(targetTableName, outputQuery) {
    return [
        'INSERT INTO ' + targetTableName,
        outputQuery
    ].join('\n');
}

function createCacheTable(databaseService, inputQuery, targetTableName, finalColumn, callback) {

    debug("targetTableName" + targetTableName)
    databaseService.run('select * from ' + targetTableName + ' limit 0', function(err) {
        if (!err) {
            return callback(null);
        }

        debug("input query" + inputQuery)
        // if table does not exist, we create it.
        databaseService.getSchema(inputQuery, function(err, columns) {
            if (err) {
                return callback(err);
            }

            var outputQuery = analysisQuery(inputQuery, columns, finalColumn);
            debug("output query" + outputQuery)

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
