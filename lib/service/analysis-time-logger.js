'use strict';

var async = require('async');
var debug = require('../util/debug')('analysis-time-logger');

function AnalysisTimeLogger(logger, batchClient) {
    this.logger = logger;
    this.batchClient = batchClient;
}

module.exports = AnalysisTimeLogger;

AnalysisTimeLogger.prototype.setLogger = function (logger) {
    this.logger = logger;
};

AnalysisTimeLogger.prototype.log = function (rows) {
    var self = this;

    var nodesToLogByJobId = getNodesToLogByJobId(rows);
    var jobIds = Object.keys(nodesToLogByJobId);
    var getJob = self.batchClient.getJob.bind(self.batchClient);

    if (!jobIds.length) {
        return;
    }

    async.map(jobIds, getJob, function (err, jobs) {
        if (err) {
            return self.logger.error(err);
        }

        if (!Array.isArray(jobs) || !jobs.length) {
            return self.logger.warn('No jobs found to log analysis time');
        }

        jobs.forEach(function (job) {
            if (!isValidToGetElapsedTime(job)) {
                return;
            }

            logElapsedTime(self.logger, nodesToLogByJobId, job);
        });
    });
};

function logElapsedTime(logger, nodesToLogByJobId, job) {
    nodesToLogByJobId[job.job_id].forEach(function (nodeId) {
        var queryElapsedTime = getQueryElapsedTime(job.query.query, nodeId);

        if (Number.isFinite(queryElapsedTime)) {
            logger.info({ node: nodeId, elapsedTime: queryElapsedTime});
        }
    });
}

function getNodesToLogByJobId(rows) {
    return rows
        .map(function (row) {
            return row.last_modified_by ? { nodeId: row.node_id, jobId: row.last_modified_by } : undefined;
        })
        .filter(function (toLog) {
            return !!toLog;
        })
        .reduce(function (byJobId, toLog) {
            if (!byJobId.hasOwnProperty(toLog.jobId)) {
                byJobId[toLog.jobId] = [];
            }

            byJobId[toLog.jobId].push(toLog.nodeId);

            return byJobId;
        }, {});
}

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
