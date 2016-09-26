'use strict';

var bunyan = require('bunyan');

module.exports = function createLogger(options) {
    if (!options) {
        return fakeLogger();
    }

    return bunyan.createLogger({
        name: 'camshaft',
        streams: [{
            level: 'info',
            stream: options.stream  || process.stdout
        }]
    });
};

function fakeLogger() {
    return {
        trace: function () {},
        debug: function () {},
        info: function () {},
        warn: function () {},
        error: function () {},
        fatal: function () {},
        child: function () { return this; }
    };
}
