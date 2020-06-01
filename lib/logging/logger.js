'use strict';

const pino = require('pino');
const Source = require('../node/nodes/source');

module.exports = class AnalysisLogger {
    constructor (
        logger = pino({ level: process.env.NODE_ENV === 'test' ? 'fatal' : 'info' }, pino.destination({ sync: false })),
        user
    ) {
        this.logger = logger;
        this.user = user;
    }

    logAnalysis (analysis) {
        analysis.getSortedNodes()
            .filter((node) => node.getType() !== Source.TYPE)
            .forEach((node) => this.logger.info({
                analysis: analysis.id(),
                node: node.id(),
                type: node.getType(),
                queued: node.didQueueWork(),
                username: this.user
            }, 'analysis:node'));
    }

    logLimitsError (err, node) {
        this.logger.info({
            'error-message': err.message,
            'error-code': err.code,
            node: node.id(),
            type: node.getType(),
            queued: node.didQueueWork(),
            username: node.getOwner()
        }, 'analysis:limits_error');
    }
};
