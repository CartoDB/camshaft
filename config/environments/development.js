'use strict';
module.exports = {
    redis: {
        host: '127.0.0.1',
        port: 6379,
        // Max number of connections in each pool.
        max: 50,
        returnToHead: true, // defines the behaviour of the pool: false => queue, true => stack
        idleTimeoutMillis: 1, // idle time before dropping connection
        reapIntervalMillis: 1, // time between cleanups
        slowQueries: {
            log: true,
            elapsedThreshold: 200
        },
        slowPool: {
            log: true, // whether a slow acquire must be logged or not
            elapsedThreshold: 25 // the threshold to determine an slow acquire must be reported or not
        },
        unwatchOnRelease: false, // Send unwatch on release, see http://github.com/CartoDB/Windshaft-cartodb/issues/161
        noReadyCheck: true // Check `no_ready_check` at https://github.com/mranney/node_redis/tree/v0.12.1#overloading
    },

    postgres: {
        template: {
            // Templated database username for authorized user
            // Supported labels: 'user_id' (read from redis)
            user: 'development_cartodb_user_{{=it.userId}}',
            // Templated database password for authorized user
            // Supported labels: 'user_id', 'user_password' (both read from redis)
            pass: '{{=it.userPass}}'
        }
    }
};
