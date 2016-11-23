'use strict';

var bunyan = require('bunyan');
var Source = require('../node/nodes/source');

function AnalysisLogger(stream, user) {
    this.logger = bunyan.createLogger({
        name: 'camshaft',
        streams: [{
            level: 'info',
            stream: stream  || process.stdout
        }]
    });
    this.user = user;
}

module.exports = AnalysisLogger;

AnalysisLogger.prototype.log = function (analysis) {
    var self = this;

    analysis.getSortedNodes()
        .forEach(function (node) {
            if (node.getType() !== Source.TYPE) {
                self.logger.info({
                    analysis: analysis.id(),
                    node: node.id(),
                    type: node.getType(),
                    queued: node.didQueueWork(),
                    username: self.user
                }, 'analysis:node');
            }
        });
};

AnalysisLogger.prototype.logLimitsError = function (err) {
    if (err) {
        this.logger.info({ 'error-message': err.message, 'error-code': err.code }, 'analysis:limits_error');
    }
};
