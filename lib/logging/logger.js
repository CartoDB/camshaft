'use strict';

const pino = require('pino');
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
                        return { levelname: 'warning' };
                    }
                    return { levelname: label };
                }
            },
            messageKey: 'event_message',
            timestamp: () => `,"timestamp":"${new Date(Date.now()).toISOString()}"`,
            serializers: {
                exception: (err) => Array.isArray(err) ? err.map((err) => errorSerializer(err)) : [errorSerializer(err)]
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
