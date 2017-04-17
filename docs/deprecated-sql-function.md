# Deprecated SQL Function analysis

## Objective
The `deprecated-sql-function` node analysis allows the execution of any arbitrary function within the analysis workflow.

## Reasoning
It opens a really wide range of possibilities without requiring to create ad-hoc analyses for specific use cases.

## Deprecated
As its name states, it is deprecated, that means, it will be removed in future versions.

## Trade-offs
Performance and stability might get compromised when using this analysis depending on the function. With great power comes great responsibility.

## Function requirements
The word _arbitrary_ gets us into the unrestricted territory. However, functions compatible with the `deprecated-sql-function` must follow some conventions and adhere to some rules.

 - Naming convention: funtions names must start with `DEP_EXT_`.
 - Funtions must implement two operations:
   1. The creation of a table to store the results.
   2. The population of that very same table.
 - (TBC) Funtions must handle, at least, the following signature:
   * First argument: a _free query_ from the primary source of the analysis.
   * Second argument: an array of `text` listing all the columns from the _free query_ in the first argument.
   * Third, and consecutive arguments up to second-to-last: it can receive an arbitrary number of `string`s and `number`s as extra arguments.
   * Second-to-last argument: the name of the table to create or populate.
   * Last argument: the operation to perform. Either `create` or `populate` the table.
 - (TBC) Functions might handle an optional signature where first, second, second-to-last, and last argument are the same as in the previous signature, but:
   * Third argument: a _free query_ from the secondary source of the analysis.
   * Forth argument: an array of `text` listing all the columns from the _free query_ in the third argument.
   * Fith, and consecutive arguments up to second-to-last: it can receive an arbitrary number of `string`s and `number`s as extra arguments.

## Examples

Let's create a couple of examples based on existing analyses.

### Buffer

TBA.

### Concave hull

TBA.
