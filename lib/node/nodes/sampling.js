'use strict';

var Node = require('../node');

var TYPE = 'sampling';

var PARAMS = {
    source: Node.PARAM.NODE(Node.GEOMETRY.ANY),
    sampling: Node.PARAM.NUMBER(),
    seed: Node.PARAM.NULLABLE(Node.PARAM.NUMBER())
};

var Sampling = Node.create(TYPE, PARAMS, { cache: true, version: 1 });

module.exports = Sampling;

var samplingTemplate = Node.template([
    'WITH _rndseed as ( select setseed({{=it.seed}}) )',
    'SELECT * FROM ({{=it.query}}) q where RANDOM() < {{=it.sampling}}'
].join('\n'));

Sampling.prototype.sql = function () {
    return samplingTemplate({
        query: this.source.getQuery(),
        sampling: this.sampling,
        seed: this.seed === null ? Math.random() : this.seed
    });
};
