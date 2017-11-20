'use strict';

var versions = require('./versions');

module.exports.getVersion = function (version) {
    if (version === 'latest') {
      version = versions[versions.length - 1];
    }
    else if (!versions.includes(version)) {
        throw new Error(
                'Invalid camshaft-reference version: "' + version + '". ' +
                'Valid versions are: ' + versions.join(', ') + '.'
        );
    }

    return require('./versions/' + version + '/reference.json');
};

module.exports.versions = versions;
