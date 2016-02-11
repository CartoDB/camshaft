'use strict';

function dot(root) {
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
            '];',
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
    dotFromNode: dot
};

function node2dot(node) {
    var d = node.toDot();

    var _node = [
        '"'+node.id()+'" [',
        '    label = <<table border="0" cellspacing="0">',
        '<tr><td border="1" port="head" bgcolor="' + d.color + '"><font point-size="16">' + d.type + '</font></td></tr>'
    ];

    Object.keys(d.nodes).forEach(function(nodeKey) {
        _node.push('<tr><td border="1" port="' + d.nodes[nodeKey].id() + '"><font color="blue">'+nodeKey+'</font></td></tr>');
    });

    Object.keys(d.attrs).forEach(function(attrKey) {
        _node.push('<tr><td border="1"><font color="purple">'+attrKey+'</font>: '+ d.attrs[attrKey]+'</td></tr>');
    });

    _node.push('</table>>');
    _node.push('];');

    return _node.join('\n');
}

function edge2dot(edge) {

    var _edge = [
        '"'+edge[1].id()+'":head -> "'+edge[0].id()+'":"'+edge[1].id()+'" [',
        '    label="'+edge[1].getQuery()+'"',
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

