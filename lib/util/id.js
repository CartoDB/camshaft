'use strict';

var crypto = require('crypto');

module.exports.id = function (content) {
    return crypto.createHash('sha1').update(JSON.stringify(content)).digest('hex');
};
