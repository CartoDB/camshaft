'use strict';

var assert = require('assert');
var Source = require('../../../lib/node/nodes/source');

describe('source-id', function () {
    var owner = 'localhost';
    it('source id change is unexpected', function () {
        var source = new Source(owner, { query: 'select * from table' });
        assert.equal(source.id(), '01ca52606f0aeb0de80639bb19db35710910456c');
    });
});
