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
        'FROM CDB_SpatialMarkovTrend(\'select * from table\', Array[\'year0\',\'year1\']) As m',
        'JOIN (select * from table) input_query',
        'ON input_query.cartodb_id = m.rowid;\n'
        ].join('\n'));
    });
});
