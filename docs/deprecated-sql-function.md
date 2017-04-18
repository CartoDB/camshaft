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

In the `buffer` analysis we want to include all existing columns but we want to expand the `the_geom` column with a
buffer in determined by an in meters `radius` param.

```sql
CREATE OR REPLACE FUNCTION DEP_EXT_buffer(
        primary_source_query text, primary_source_columns text[], radius numeric, table_name text, operation text
    )
    RETURNS VOID AS $$
        DECLARE selected_columns TEXT;
        BEGIN
            -- We want to drop original `the_geom` column as we are gonna return a different one.
            SELECT array_to_string(
              array_cat(
                array_remove(primary_source_columns, 'the_geom'),
                -- And we add our new `the_geom` column using the `radius` argument.
                ARRAY['ST_Buffer(the_geom::geography, ' || radius || ')::geometry AS the_geom']
              ),
              ','
            ) INTO selected_columns;
            IF operation = 'create' THEN
                -- In some cases you might want to drop the table.
                -- EXECUTE 'DROP TABLE ' || table_name || ';';
                -- We use our prepared columns to select from the original query.
                EXECUTE 'CREATE TABLE ' || table_name || ' AS SELECT ' || selected_columns || ' FROM (' || primary_source_query || ') _q LIMIT 0';
            ELSIF operation = 'populate' THEN
                EXECUTE 'INSERT INTO ' || table_name || ' SELECT ' || selected_columns || ' FROM (' || primary_source_query || ') _q';
            END IF;
        END;
$$ LANGUAGE plpgsql;
```

The framework, behind the scenes, will call that function in two phases:

1. It call the new function with the `create` operation, so we can create a table, something like:

```sql
select * from DEP_EXT_buffer(
  'select 1 as cartodb_id, st_setsrid(st_makepoint(0,0), 4326) as the_geom',
  ARRAY['cartodb_id', 'the_geom'],
  1000,
  'wadus_table',
  'create'
);
```

2. Later, it will invoke the same function but it will do it with `populate` as the operation to perform, like in:

```sql
select * from DEP_EXT_buffer(
  'select 1 as cartodb_id, st_setsrid(st_makepoint(0,0), 4326) as the_geom',
  ARRAY['cartodb_id', 'the_geom'],
  1000,
  'wadus_table',
  'populate'
);
```

### Concave hull

TBA.
