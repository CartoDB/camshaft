'use strict';

var v = require('./versions');

module.exports.getVersion = function (version) {
    if (version === 'latest') {
        version = v.target;
    }
    else if (!v.versions.includes(version)) {
        throw new Error(
                'Invalid camshaft-reference version: "' + version + '". ' +
                'Valid versions are: ' + v.versions.join(', ') + '.'
        );
    }

    return require('./versions/' + version + '/reference.json');
};

module.exports.versions = v.versions;
