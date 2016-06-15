'use strict';

function Validator(type, isValid, nullable, expects, defaultValue, toJSON) {
    this.type = type;
    this.isValid = isValid;
    this.nullable = nullable || false;
    this.expects = expects || type;
    this.defaultValue = defaultValue || null;
    this._toJSON = toJSON;
}

Validator.prototype.toJSON = function() {
    var json = {
        type: this.type
    };
    if (this._toJSON) {
        json = this._toJSON();
    }
    if (this.nullable) {
        json.optional = true;
        if (this.getDefaultValue()) {
            json['default-value'] = this.getDefaultValue();
        }
    }
    return json;
};

Validator.prototype.getDefaultValue = function() {
    return this.defaultValue;
};

module.exports = Validator;
