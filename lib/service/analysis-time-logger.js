'use strict';

var async = require('async');
var debug = require('../util/debug')('analysis-time-logger');

function AnalysisTimeLogger(logger, batchClient) {
    this.logger = logger;
    this.batchClient = batchClient;
}

module.exports = AnalysisTimeLogger;

AnalysisTimeLogger.prototype.log = function (rows) {
    var self = this;
    var logElapsedTime = self._logNodeElapsedTime.bind(self);
    var nodesToLog = getNodesToLogFromRows(rows);

    async.map(nodesToLog, logElapsedTime, function (err) {
        if (err) {
            return self.logger.error(err);
        }
    });
};

function getNodesToLogFromRows(rows) {
    return rows
        .map(function (row) {
            return row.last_modified_by ? { nodeId: row.node_id, jobId: row.last_modified_by } : undefined;
        })
        .filter(function (toLog) {
            return !!toLog;
        });
}

AnalysisTimeLogger.prototype._logNodeElapsedTime = function (nodeToLog, callback) {
    var self = this;

    this._getNodeElapsedTime(nodeToLog.jobId, nodeToLog.nodeId, function (err, elapsedTimeMilliseconds) {
        if (err) {
            return callback(err);
        }

        if (Number.isFinite(elapsedTimeMilliseconds)) {
            self.logger.info({ node: nodeToLog.nodeId, elapsedTime: elapsedTimeMilliseconds});
        }

        callback();
    });
};

AnalysisTimeLogger.prototype._getNodeElapsedTime = function(jobId, nodeId, callback) {
    this.batchClient.getJob(jobId, function (err, job) {
        if (err) {
            return callback(err);
        }

        if (!isValidToGetElapsedTime(job)) {
            return callback();
        }

        var queryElapsedTime = getQueryElapsedTime(job.query.query, nodeId);

        if (!queryElapsedTime) {
            return callback();
        }

        callback(null, queryElapsedTime);
    });
};

function isValidToGetElapsedTime(job) {
    return job && job.status === 'done' && job.query && Array.isArray(job.query.query);
}

function getQueryElapsedTime (queries, nodeId) {
    for (var i = 0; i < queries.length; i++) {
        if (!isQueryOfNodeId(queries[i].query, nodeId)) {
            continue;
        }

        var start = new Date(queries[i].started_at);
        var end = new Date(queries[i].ended_at);

        if (!start || !end) {
            continue;
        }

        var elapsedTimeMilliseconds = end.getTime() - start.getTime();

        debug('analysis time %j', { analysis: nodeId, time: elapsedTimeMilliseconds });
        return elapsedTimeMilliseconds;
    }
}

function isQueryOfNodeId(query, nodeId) {
    return query.indexOf('/* camshaft_node_id: ' + nodeId) !== -1;
}
