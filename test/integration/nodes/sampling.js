'use strict';

var assert = require('assert');
var Source = require('../../../lib/node/nodes/source');
var Sampling = require('../../../lib/node/nodes/sampling');

describe('sampling', function() {

    var source = new Source({ query: 'select * from table' });

    it('should set random sampling', function() {
        var sampling = new Sampling({ source: source, sampling: 0.4 });

        assert.equal(sampling.sampling, 0.4);
    });

    it('should set seed', function() {
        var sampling = new Sampling({ source: source, sampling: 0.4, seed: 0.1 });

        assert.equal(sampling.seed, 0.1);
        assert.equal(sampling.sql(), [
          'WITH _rndseed as ( select setseed(0.1) )',
          'SELECT * FROM (select * from table) q where RANDOM() < 0.4'
        ].join('\n'));
    });
});
