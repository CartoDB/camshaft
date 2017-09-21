'use strict';

function stripTtableName(name) {
    return name.split('.').pop();
}

// This class is used to help generate the names of node query columns
module.exports = class ColumnNamer {
    constructor (columns) {
        this.columns = columns.map(name => stripTtableName(name));
    }

    uniqueName(baseName) {
        var name = baseName;
        var ok = this.isUnique(name);
        if (!ok) {
            // try adding a numeric suffix
            var count = 1;
            while (!ok) {
                name = baseName + '_' + (++count);
                ok = this.isUnique(name);
            }
        }
        this.columns.push(name); // ?
        return name;
    }

    isUnique(name) {
        // TODO: should this be case-insensitive?
        return !this.columns.includes(name);
    }

};
