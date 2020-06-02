'use strict';

const pino = require('pino');
const Source = require('../node/nodes/source');

module.exports = class AnalysisLogger {
    constructor (logger, user) {
        this._user = user;

        if (!logger) {
            const { LOG_LEVEL, NODE_ENV } = process.env;
            const logLevelFromNodeEnv = NODE_ENV === 'test' ? 'fatal' : 'info';
            const options = {
                base: null, // Do not bind hostname, pid and friends by default
                level: LOG_LEVEL || logLevelFromNodeEnv
            };
            const dest = pino.destination({ sync: false }); // stdout

            logger = pino(options, dest);
        }

        this._logger = logger;
    }

    logAnalysis (analysis) {
        analysis.getSortedNodes()
            .filter((node) => node.getType() !== Source.TYPE)
            .forEach((node) => this._logger.info({
                analysis: analysis.id(),
                node: node.id(),
                type: node.getType(),
                queued: node.didQueueWork(),
                username: this._user
            }, 'analysis:node'));
    }

    logLimitsError (err, node) {
        this._logger.info({
            'error-message': err.message,
            'error-code': err.code,
            node: node.id(),
            type: node.getType(),
            queued: node.didQueueWork(),
            username: node.getOwner()
        }, 'analysis:limits_error');
    }
};
