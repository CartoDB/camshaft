'use strict';

function strip_table_name(name) {
    return name.split('.').pop();
}

// This class is used to help generate the names of node query columns
module.exports = class ColumnNamer {
    constructor (node_params, columns) {
        this.node_id = node_params && node_params.id;
        this.columns = columns.map(name => strip_table_name(name));
    }

    uniqueName(baseName) {
        var name = baseName;
        var ok = this.isUnique(name);
        if (!ok) {
            if (this.node_id) {
                // try with node_id as a suffix
                name = baseName + '_' + this.node_id;
                ok = this.isUnique(name);
            }
            if (!ok) {
                // try adding a numeric suffix
                var count = 1;
                var new_name;
                while (!ok) {
                    // we use name, not baseName, so we use the node_id if possible
                    new_name = name + '_' + (++count);
                    ok = this.isUnique(new_name);
                }
                name = new_name;
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
