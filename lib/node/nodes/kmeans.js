'use strict';

var Node = require('../node')
var dot = require('dot')

var TYPE = 'kmeans';

var PARAMS = {
    source : Node.PARAM.NODE(Node.GEOMETRY.POINT),
    no_clusters : Node.PARAM.NUMBER
}

var KMeans  = Node.create(TYPE, PARAMS, {cache: false})

module.exports = KMeans;
module.exports.TYPE = TYPE;
module.exports.PARAMS = PARAMS;

var KMeansQueryTemplate = dot.template([
    "select q.*, clusters.cluster_no", 
    "from cdb_crankshaft.cdb_KMeans('{{=it.query}}',{{=it.no_clusters}}) clusters,",
    "({{=it.query}}) q",
    "WHERE q.cartodb_id = clusters.cartodb_id"
].join('\n'));

function query(it) {
    return KMeansQueryTemplate(it);
}

KMeans.prototype.sql = function(){
    return query({
        query : this.source.getQuery(),
        no_clusters : this.no_clusters
    })
}
