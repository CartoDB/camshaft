'use strict';

var debug = require('debug');
module.exports = function turboCartoCssDebug (ns) {
    return debug(['analysis', ns].join(':'));
};
