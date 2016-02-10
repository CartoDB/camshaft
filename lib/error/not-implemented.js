'use strict';

module.exports = function NotImplemented(message) {
    Error.captureStackTrace(this, this.constructor);
    this.name = this.constructor.name;
    this.message = message || 'Not Implemented';
};

require('util').inherits(module.exports, Error);
