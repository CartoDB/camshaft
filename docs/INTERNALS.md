# Internals

- Analysis: graph representing how data is computed, an Analysis is defined by its Nodes.
- Node: each vertex in an Analysis, represents data with SQL queries that can be used as final output
or as input for other Nodes.
- Source: the most basic Node type, defines a Node with raw SQL.
- Operation: a Node that takes one or more Node objects as input and produces one Node.

## Node

All Nodes in the Analysis are identified by an ID. IDs are unique within an the graph.

## Workflow data structure

Workflow graph is a directed acyclic graph.


## References
 - [The Architecture of Open Source Applications: Git](http://www.aosabook.org/en/git.html)
 - [Wikipedia: Directed acyclic graph](https://en.wikipedia.org/wiki/Directed_acyclic_graph)