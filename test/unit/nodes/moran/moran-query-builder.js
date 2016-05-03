'use strict';

var assert = require('assert');
var Node = require('../../../../lib/node/node');
var buildQuery = Node.getSqlTemplateFn('moran');

describe('moran-query-builder', function() {
    var queryExpected = [
        'WITH',
        'input_query AS (',
        '  select * from wadus',
        '),',
        'moran AS (',
        '  SELECT * FROM',
        '  cdb_crankshaft.cdb_moran_local_rate(',
        '    \'select * from wadus\',',
        '    \'num_col\',',
        '    \'den_col\',',
        '    1,',
        '    2,',
        '    3,',
        '    \'the_geom\',',
        '    \'cartodb_id\',',
        '    \'integer\'',
        '  )',
        ')',
        'SELECT input_query.*, moran.*',
        'FROM input_query JOIN moran',
        'ON moran.ids = input_query.cartodb_id\n'
    ].join('\n');

    it('should build query properly', function() {
        assert.equal(queryExpected, buildQuery({
            _query: 'select * from wadus',
            _numeratorColumn: 'num_col',
            _denominatorColumn: 'den_col',
            _significance: 1,
            _neighbours: 2,
            _permutations: 3,
            _wType: 'integer'
        }));
    });
});
