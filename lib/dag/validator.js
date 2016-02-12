'use strict';

var toposort = require('./toposort');

function isValid(rootNode) {
    var valid = true;
    try {
        toposort(rootNode);
    } catch (e) {
        valid = false;
    }

    return valid;
}

module.exports = {
    isValid: isValid
};
