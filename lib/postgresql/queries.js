'use strict';

function pgQuoteCastMapper(cast) {
    return function(input) {
        return '\'' + input + '\'' + (cast ? ('::' + cast) : '');
    };
}
module.exports.pgQuoteCastMapper = pgQuoteCastMapper;

var EMPTY_ARRAY_SQL = '\'{}\'';
function pgArray(input, cast) {
    if (input.length === 0) {
        return cast ? ('ARRAY[]::' + cast + '[]') : EMPTY_ARRAY_SQL;
    }
    return 'ARRAY[' + input.join(', ') + ']';
}
module.exports.pgArray = pgArray;
