'use strict';

var dot = require('dot');
dot.templateSettings.strip = false;

var headerTemplate = dot.template(
    '<tr><td border="1" port="head" bgcolor="{{=it._color}}"><font point-size="16">{{=it._type}}</font></td></tr>'
);
var nodeTemplate = dot.template(
    '<tr><td border="1" port="{{=it._id}}"><font color="blue">{{=it._key}}</font></td></tr>'
);
var attrTemplate = dot.template(
    '<tr><td border="1"><font color="purple">{{=it._key}}</font>: {{=it._val}}</td></tr>'
);

function dotFromNode(root) {
    var nodes = [];
    var edges = [];

    nodesAndEdges(root, nodes, edges);

    var gv = [
        'digraph g {',
            'graph [',
            '    rankdir = "LR"',
            '];',
            'node [',
            '    fontsize = "12"',
            '    shape = "none"',
            '];',
            'edge [',
            '    fontsize = "8"',
            '];'
    ];

    nodes.forEach(function(node) {
        gv.push(node2dot(node));
    });

    var resultNode = {
        id: function() { return 'result'; },
        getQuery: function() { return root.getQuery(); },
        toDot: function() {
            return {
                type: 'result',
                color: 'lightblue',
                nodes: {},
                attrs: {}
            };
        }
    };
    gv.push(node2dot(resultNode));
    gv.push(edge2dot([resultNode, root]));

    edges.forEach(function(edge) {
        gv.push(edge2dot(edge));
    });

    gv.push('}');

    return gv.join('\n');
}

module.exports = {
    dotFromNode: dotFromNode
};

function node2dot(node) {
    var d = node.toDot();

    var _node = [
        '"'+node.id()+'" [',
        '    label = <<table border="0" cellspacing="0">',
        headerTemplate({_color: d.color || 'white', _type: d.type})
    ];

    Object.keys(d.nodes).forEach(function(nodeKey) {
        _node.push(nodeTemplate({_id: d.nodes[nodeKey].id(), _key: nodeKey}));
    });

    Object.keys(d.attrs).forEach(function(attrKey) {
        _node.push(attrTemplate({_key: attrKey, _val: d.attrs[attrKey]}));
    });

    _node.push('</table>>');
    _node.push('];');

    return _node.join('\n');
}

function edge2dot(edge) {

    var _edge = [
        '"'+edge[1].id()+'":head -> "'+edge[0].id()+'":"'+edge[1].id()+'" [',
        '    label='+JSON.stringify(edge[1].getQuery()),
        '];'
    ];

    return _edge.join('\n');
}

function nodesAndEdges(root, nodes, edges) {
    nodes.push(root);

    var inputNodes = root.getInputNodes();
    if (inputNodes.length) {
        inputNodes.forEach(function(inputNode) {
            edges.push([root, inputNode]);
            nodesAndEdges(inputNode, nodes, edges);
        });
    }
}
