'use strict';

var assert = require('assert');

var ColumnNamer = require('../../lib/node/column-namer');

describe('column-namer', function() {

    it('should not change unique names', function() {
        var namer = new ColumnNamer({ id: 'xxx' }, ['col1', 'col2', 'col3' ]);
        assert.equal(namer.uniqueName('col4'), 'col4');
    });

    it('should use the node id if available', function() {
        var namer = new ColumnNamer({ id: 'a0' }, ['col1', 'col2', 'col3' ]);
        assert.equal(namer.uniqueName('col2'), 'col2_a0');
    });

    it('should use a count when no id', function() {
        var namer = new ColumnNamer({}, ['col1', 'col2', 'col3' ]);
        assert.equal(namer.uniqueName('col2'), 'col2_2');
    });

    it('should add a counter to the node id if necessary', function() {
        var namer = new ColumnNamer({ id: 'a0' }, ['col1', 'col2', 'col3', 'col2_a0' ]);
        assert.equal(namer.uniqueName('col2'), 'col2_a0_2');
    });

    it('should add higher counts to the node id if necessary', function() {
        var namer = new ColumnNamer({ id: 'a0' }, ['col1', 'col2', 'col3', 'col2_a0', 'col2_a0_2', 'col2_a0_3' ]);
        assert.equal(namer.uniqueName('col2'), 'col2_a0_4');
    });

    it('should use higher counts if necessary', function() {
        var namer = new ColumnNamer({}, ['col1', 'col2', 'col3', 'col2_2', 'col2_3', 'col2_4' ]);
        assert.equal(namer.uniqueName('col2'), 'col2_5');
    });

    it('should accept table names in the columns', function() {
        var namer = new ColumnNamer({ id: 'xxx' }, ['table.col1', 'table.col2', 'table.col3' ]);
        assert.equal(namer.uniqueName('col1'), 'col1_xxx');
        assert.equal(namer.uniqueName('col4'), 'col4');
    });

});
