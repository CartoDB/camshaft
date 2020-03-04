// Constructor for node limits error objects

'use strict';

function nodeError (node, messages) {
    var err = null;
    if (messages.length > 0) {
        err = new Error(messages.join('; \n'));
        err.node_id = node.params ? node.params.id : undefined;
    }
    return err;
}

module.exports = nodeError;
