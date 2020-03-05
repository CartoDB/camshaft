'use strict';

var assert = require('assert');
var Source = require('../../../lib/node/nodes/source');
var DatabaseService = require('../../../lib/service/database');
var testConfig = require('../../test-config');

function isValidDate (d) {
    return d instanceof Date && !isNaN(d.valueOf());
}

describe('database service', function () {
    var SKIP = true;
    var QUERY_NO_QUERYTABLES = 'select * from nulltime';

    describe('.getMetadataFromAffectedTables()', function () {
        beforeEach(function () {
            this.databaseService = new DatabaseService(testConfig.user, testConfig.db, testConfig.batch);
        });

        // See: https://github.com/CartoDB/camshaft/issues/279
        it('should not create invalid date for last_update', function (done) {
            var originalQueryRunner = this.databaseService.queryRunner.run;
            var runQueryStubCalled = false;
            this.databaseService.queryRunner.run = function (sql, readOnly, callback) {
                runQueryStubCalled = true;
                callback(null, { rows: [] });
            };
            var source = new Source(testConfig.user, { query: QUERY_NO_QUERYTABLES });

            this.databaseService.getMetadataFromAffectedTables(source, !SKIP, function (err, metadatadata) {
                assert.ifError(err);

                assert.ok(runQueryStubCalled);
                assert.ok(Object.prototype.hasOwnProperty.call(metadatadata, 'last_update'));
                assert.ok(isValidDate(metadatadata.last_update), 'last_update is an invalid date');
                this.databaseService.queryRunner.run = originalQueryRunner;

                done();
            }.bind(this));
        });
    });
});
