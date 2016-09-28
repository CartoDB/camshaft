'use strict';

var async = require('async');
var debug = require('../util/debug')('analysis-logger');
var bunyan = require('bunyan');

function AnalysisLogger(options, batchClient) {

    this.logger = bunyan.createLogger({
        name: 'camshaft',
        streams: [{
            level: 'info',
            stream: options.stream  || process.stdout
        }]
    });
    this.batchClient = batchClient;
}

module.exports = AnalysisLogger;

AnalysisLogger.prototype.log = function (analysis, rows, user) {
    var logger = this.logger.child({ analysis: analysis.getRoot().id(), username: user }, true);
    var nodesToLog = getNodesToLog(analysis, rows);

    debug('Nodes to log %j', nodesToLog);

    populateNodesWithJobs(this.batchClient, nodesToLog, function (err, nodesToLog) {
        if (err) {
            return logger.error(err);
        }

        nodesToLog.forEach(function (node) {
            logger.info(node, 'analysis:node');
        });
    });
};

function getNodesToLog (analysis, rows) {
  var getJobIdFromLastModifiedBy = getJobIdFromLastModifiedByFunction(rows);

  return analysis.getSortedNodes()
      .map(function (node) {
          return {
              node: node.id(),
              type: node.getType(),
              job: getJobIdFromLastModifiedBy(node.id()) || undefined
          };
      });
}

function getJobIdFromLastModifiedByFunction (rows) {
    return function (nodeId) {
        for (var i = 0; i < rows.length; i++) {
          if (rows[i].node_id === nodeId) {
            return rows[i].last_modified_by;
          }
        }
    };
}

function populateNodesWithJobs (batchClient, nodesToLog, callback) {
    var nodesToLogByJobId = getNodesToLogByJobId(nodesToLog);
    var jobIds = Object.keys(nodesToLogByJobId);
    var populateNodesWithTime = populateNodesWithTimeFunction(batchClient, nodesToLogByJobId);

    async.map(jobIds, populateNodesWithTime, function (err, nodesToLogWithJobAndTime) {
        if (err) {
            return callback(err);
        }

        var nodesToLog = nodesToLogWithJobAndTime
            .reduce(function (nodes, nodesByJobId) {
                return nodes.concat(nodesByJobId);
            });

        callback(null, nodesToLog);
    });
}

function getNodesToLogByJobId (nodesToLog) {
    return nodesToLog
        .reduce(function (byJobId, toLog) {
            if (!byJobId.hasOwnProperty(toLog.job)) {
                byJobId[toLog.job] = [];
            }

            byJobId[toLog.job].push(toLog);

            return byJobId;
        }, {});
}


function populateNodesWithTimeFunction (batchClient, nodesToLogByJobId) {
    return function (jobId, callback) {
        var nodesToLog = nodesToLogByJobId[jobId];

        if (!jobId) {
            return callback(null, nodesToLog);
        }

        batchClient.getJob(jobId, function (err, job) {
            if (err) {
                return callback(err);
            }

            if (!isValidToGetElapsedTime(job)) {
                return callback(null, nodesToLog);
            }

            nodesToLog.forEach(function (nodeToLog) {
                var queryElapsedTime = getQueryElapsedTime(job.query.query, nodeToLog.node);

                if (Number.isFinite(queryElapsedTime)) {
                    nodeToLog.elapsedTime = queryElapsedTime;
                }
            });

            callback(null, nodesToLog);
        });
    };
}

function isValidToGetElapsedTime (job) {
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

function isQueryOfNodeId (query, nodeId) {
    return query.indexOf('/* camshaft_node_id: ' + nodeId) !== -1;
}
