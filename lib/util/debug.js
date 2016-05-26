'use strict';

var debug = require('debug');

module.exports = function camshaftDebug (ns) {
    return debug(['camshaft', ns].join(':'));
};
