# Internals

- Analysis: graph representing how data is computed, an Analysis is defined by its Nodes.
- Node: each vertex in an Analysis, represents data with SQL queries that can be used as final output
or as input for other Nodes.
- Source: the most basic Node type, defines a Node with raw SQL.
- Operation: a Node that takes one or more Node objects as input and produces one Node.

## Node

All Nodes in the Analysis are identified by an ID. IDs are unique within an the graph.

Nodes work like black boxes, internal implementation is hidden and we only care about what their output is: a SQL query.

In that matter a Node could cache result in a table, or several tables, and return a plain `SELECT * FROM cached_table`
query from that cached table. Or it could even generate several cache tables, e.g., a routing analysis could generate a
table for lines and another for points.

## Workflow data structure

Workflow graph is a directed acyclic graph.


## References
 - [The Architecture of Open Source Applications: Git](http://www.aosabook.org/en/git.html)
 - [Wikipedia: Directed acyclic graph](https://en.wikipedia.org/wiki/Directed_acyclic_graph)