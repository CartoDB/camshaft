'use strict';

var id = require('../util/id');

var TYPE = 'buffer';

function Buffer(inputNode, radio) {
    this.inputNode = inputNode;
    this.radio = radio;
}

module.exports.TYPE = TYPE;
module.exports.create = function(definition, factory, databaseService, callback) {
    factory.create(definition.params.source, function(err, node) {
        if (err) {
            return callback(err);
        }

        return callback(null, new Buffer(node, definition.params.radio));
    });
};

// ------------------------------ PUBLIC API ------------------------------ //

Buffer.prototype.id = function() {
    return id(this.toJSON());
};

Buffer.prototype.getQuery = function() {
    return [
        'SELECT st_buffer(the_geom, 1000) AS the_geom, * FROM (',
        this.inputNode.getQuery(),
        ') _cdb_buffer_query'
    ].join('\n');
};

Buffer.prototype.getInputNodes = function() {
    return [this.inputNode];
};

Buffer.prototype.toJSON = function() {
    return {
        type: TYPE,
        inputNodeId: this.inputNode.id(),
        radio: this.radio
    };
};

Buffer.prototype.toDot = function() {
    return {
        type: TYPE,
        color: 'orange',
        nodes: {
            inputNode: this.inputNode
        },
        attrs: {
            radio: this.radio
        }
    };
};

// ---------------------------- END PUBLIC API ---------------------------- //
