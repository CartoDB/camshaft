'use strict';

var bunyan = require('bunyan');

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
            if (node.getType() !== 'source') {
                self.logger.info({
                    analysis: analysis.getRoot().id(),
                    node: node.id(),
                    type: node.getType(),
                    username: self.user
                }, 'analysis:node');
            }
        });
};
