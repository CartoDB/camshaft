'use strict';

const stripTableName = name => name.split('.').pop();

// This class is used to help generate the names of node query columns
module.exports = class ColumnNamer {
    constructor (columns) {
        this.columns = columns.map(name => stripTableName(name).toLowerCase());
    }

    uniqueName(baseName) {
        baseName = baseName.toLowerCase();
        let name = baseName;
        let ok = this.isUnique(name);
        let count = 1;
        while (!ok) {
            name = baseName + '_' + (++count);
            ok = this.isUnique(name);
        }
        this.columns.push(name);
        return name;
    }

    isUnique(name) {
        return !this.columns.includes(name);
    }

};
