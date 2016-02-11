'use strict';

var debug = require('debug');
module.exports = function turboCartoCssDebug (ns) {
    return debug(['camshaft', ns].join(':'));
};
