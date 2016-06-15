'use strict';

var TYPE = require('../type');

function EnumValidator(validValues) {
    this.type = TYPE.ENUM;
    this.validValues = validValues;
    this.isValid = function(val) {
        return validValues.indexOf(val) > -1;
    };
    this.expects = TYPE.ENUM + '(' + validValues.map(JSON.stringify).join(',') + ')';
}

EnumValidator.prototype.toJSON = function() {
    return {
        type: this.type,
        values: this.validValues
    };
};

EnumValidator.prototype.getDefaultValue = function() {
    return this.validValues[0];
};

module.exports = EnumValidator;