'use strict';

/**
 * Validates column names and types in the Node schema match.
 *
 * @param {Array<{name: columnName, type: columnType}>} requiredColumns
 */
function SchemaValidator(requiredColumns) {
    this.requiredColumns = requiredColumns;
}

SchemaValidator.prototype.isValid = function(node, errors) {
    var missingColumnsErrors = [];
    this.requiredColumns.forEach(function(column) {
        if (node.schema.hasOwnProperty(column.name) || node.schema.hasOwnProperty(`"${column.name}"`)) {
            if (node.schema[column.name] !== column.type) {
                missingColumnsErrors.push(
                    new Error('Invalid type for column "' + column.name +
                        '": expected `' + column.type +
                        '` got `' + node.schema[column.name] + '`'
                    )
                );
            }
        } else {
            missingColumnsErrors.push(new Error('Missing required column `' + column.name + '`'));
        }
    });
    if (missingColumnsErrors.length > 0) {
        missingColumnsErrors.forEach(function(e) {
            errors.push(e);
        });
        return false;
    }
    return true;
};

module.exports = SchemaValidator;
