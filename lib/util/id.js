'use strict';

var crypto = require('crypto');

module.exports.id = function (content) {
    return crypto.createHash('sha1').update(JSON.stringify(content)).digest('hex');
};

module.exports.buster = function () {
    var hrTime = process.hrtime();
    return hrTime[0] * 1000000 + Math.round(hrTime[1] / 1000);
};
