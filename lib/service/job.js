'use strict';

// {
//     query: [{
//         query:"SELECT pg_sleep(0)",
//         onsuccess: "SELECT pg_sleep(0)",
//         onerror: "SELECT pg_sleep(0)"
//     }],
//     onsuccess: "SELECT pg_sleep(0)",
//     onerror: "SELECT pg_sleep(0)"
// }

function Job(definition) {
    this._definition = definition || {
        query: []
    };
}
module.exports = Job;

Job.prototype.getQueries = function () {
    return this._definition;
};

Job.prototype.push = function (query) {
    return this.addQuery(query);
};

Job.prototype.hasQueries = function () {
    return this.getQueries().query.length > 0;
};

Job.prototype.addQuery = function (query) {
    switch (typeof query) {
        case 'string':
            this._addSimpleQuery(query);
            break;
        default:
            this._addQueryWithFallback(query);
    }

    return this;
};

Job.prototype._addSimpleQuery = function (query) {
    this._definition.query.push({ query: query });
};

Job.prototype._addQueryWithFallback = function (query) {
    this._definition.query.push(query);
};

Job.prototype.addOnSuccess = function (query) {
    this._definition.onsuccess = query;
    return this;
};

Job.prototype.addOnError = function (query) {
    this._definition.onerror = query;
    return this;
};
