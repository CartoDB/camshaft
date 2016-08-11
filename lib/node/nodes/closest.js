'use strict';

var Node = require('../node');

var TYPE = 'closest';

var PARAMS = {
    source: Node.PARAM.NODE(Node.GEOMETRY.ANY),
    target: Node.PARAM.NODE(Node.GEOMETRY.ANY)
};

var Closest = Node.create(TYPE, PARAMS, {cache: true, version: 1});

module.exports = Closest;
module.exports.TYPE = TYPE;
module.exports.PARAMS = PARAMS;

var samplingTemplate = Node.template([


    'WITH _rndseed as ( select setseed({{=it.seed}}) )',
    'SELECT * FROM ({{=it.query}}) q where RANDOM() < {{=it.sampling}}',
].join('\n'));


Sampling.prototype.sql = function(){
    return samplingTemplate({
        squery: this.source.getQuery(),
        tquery: this.target.getQuery()
    });
};
