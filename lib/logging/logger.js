'use strict';

const pino = require('pino');
const Source = require('../node/nodes/source');
const { err, wrapErrorSerializer } = pino.stdSerializers;
const DEV_ENVS = ['test', 'development'];

module.exports = class AnalysisLogger {
    constructor (logger) {
        const { LOG_LEVEL, NODE_ENV } = process.env;
        const logLevelFromNodeEnv = NODE_ENV === 'test' ? 'fatal' : 'info';
        const errorSerializer = DEV_ENVS.includes(NODE_ENV) ? err : wrapErrorSerializer(err => {
            err.stack = err.stack.split('\n').slice(0, 3).join('\n');
            return err;
        });

        const options = {
            base: null, // Do not bind hostname, pid and friends by default
            level: LOG_LEVEL || logLevelFromNodeEnv,
            formatters: {
                level (label) {
                    if (label === 'warn') {
                        return { level: 'warning' };
                    }
                    return { level: label };
                }
            },
            messageKey: 'message',
            timestamp: pino.stdTimeFunctions.isoTime,
            serializers: {
                analysis: (analysis) => {
                    const nodes = analysis.getSortedNodes()
                        .filter((node) => node.getType() !== Source.TYPE)
                        .map((node) => ({
                            id: node.id(),
                            status: node.getStatus(),
                            queued: node.didQueueWork(),
                            affectedTables: node.getAffectedTables(),
                            outdated: node.isOutdated(),
                            tags: node.getTags(),
                            targetTable: node.getTargetTable(),
                            params: node.toJSON()
                        }));

                    return { id: analysis.id(), user: analysis.getRoot().getOwner(), nodes };
                },
                error: errorSerializer
            }
        };

        if (!logger) {
            const dest = pino.destination({ sync: false }); // stdout
            this._logger = pino(options, dest);
        } else {
            this._logger = logger.child({ serializers: options.serializers });
        }
    }

    trace (...args) {
        this._logger.trace(...args);
    }

    debug (...args) {
        this._logger.debug(...args);
    }

    info (...args) {
        this._logger.info(...args);
    }

    warn (...args) {
        this._logger.warn(...args);
    }

    error (...args) {
        this._logger.error(...args);
    }

    fatal (...args) {
        this._logger.fatal(...args);
    }
};
