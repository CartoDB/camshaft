'use strict';

var crypto = require('crypto');

function id(content) {
    return crypto.createHash('sha1').update(JSON.stringify(content)).digest('hex');
}

module.exports = id;
