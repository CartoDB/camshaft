'use strict';

function Validator(type, isValid, nullable, expects, defaultValue) {
    this.type = type;
    this.isValid = isValid;
    this.nullable = nullable || false;
    this.expects = expects || type;
    this.defaultValue = defaultValue || null;
}

Validator.prototype.toJSON = function() {
    var json = {
        type: this.type
    };
    if (this.nullable) {
        json.optional = true;
    }
    return json;
};

Validator.prototype.getDefaultValue = function() {
    return this.defaultValue;
};

module.exports = Validator;
