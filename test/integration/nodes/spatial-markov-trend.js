'use strict';

var assert = require('assert');
var Source = require('../../../lib/node/nodes/source');
var SpatialMarkovTrend = require('../../../lib/node/nodes/spatial-markov-trend');

describe('spatial-markov-trend', function() {

    var owner = 'localhost';
    var source = new Source(owner, { query: 'select * from table' });

    it('should generate sql', function() {
        var spatialMarkov = new SpatialMarkovTrend(owner, { source: source, time_columns: ['year0', 'year1'] });

        assert.equal(spatialMarkov.sql(), [
        'SELECT',
        '  input_query.*,',
        '  m.trend,',
        '  m.trend_up,',
        '  m.trend_down,',
        '  m.volatility',
        'FROM cdb_crankshaft.CDB_SpatialMarkovTrend(\'select * from table\', Array[\'year0\',\'year1\'], \
5, \'knn\', 5, 2, \'the_geom\', \'cartodb_id\') As m',
        'JOIN (select * from table) input_query',
        'ON input_query.cartodb_id = m.rowid\n'
        ].join('\n'));
    });

    it('should generate sql with optional params', function() {
        var spatialMarkov = new SpatialMarkovTrend(owner, { source: source, time_columns: ['year0', 'year1'], permutations: 21, weight_type: 'queen', geom_col: 'geom' });

        assert.equal(spatialMarkov.sql(), [
        'SELECT',
        '  input_query.*,',
        '  m.trend,',
        '  m.trend_up,',
        '  m.trend_down,',
        '  m.volatility',
        'FROM cdb_crankshaft.CDB_SpatialMarkovTrend(\'select * from table\', Array[\'year0\',\'year1\'], \
5, \'queen\', 5, 21, \'geom\', \'cartodb_id\') As m',
        'JOIN (select * from table) input_query',
        'ON input_query.cartodb_id = m.rowid\n'
        ].join('\n'));
    });
});
