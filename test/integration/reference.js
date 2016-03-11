'use strict';

var assert = require('assert');

var reference = require('../../reference');

describe('camshaft-reference', function() {

    it('should expose a versions list', function() {
        assert.ok(reference.versions);
        assert.ok(Array.isArray(reference.versions));
    });

    it('should expose a latest version through a getVersion method', function() {
        var latest = reference.getVersion('latest');
        assert.ok(latest);
        assert.ok(latest.version);
    });

    it('should fail to retrieve an invalid reference version', function() {
        assert.throws(
            function() {
                reference.getVersion('wadus-version');
            },
            function(err) {
                assert.ok(
                    err.message.match(/^Invalid\scamshaft-reference\sversion:\s"wadus-version"\./)
                );
                return true;
            }
        );
    });

});
