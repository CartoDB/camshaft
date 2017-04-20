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
 - Funtions must handle, at least, the following signature:
   * First parameter: the operation to perform. Either `create` or `populate` the table.
   * Second parameter: the name of the table to create or populate.
   * Third parameter: a _free query_ from the primary source of the analysis.
   * Forth parameter: an array of `text` listing all the columns from the _free query_ in the third parameter.
   * Third, and consecutive parameters: it can receive an arbitrary number of `string`s and `number`s as extra parameters.
 - Functions might handle an optional signature where first, second, third and forth are the same as in the previous signature, but:
   * Fifth parameter: a _free query_ from the secondary source of the analysis.
   * Sixth parameter: an array of `text` listing all the columns from the _free query_ in the fifth parameter.
   * Seventh, and consecutive parameters up to second-to-last: it can receive an arbitrary number of `string`s and `number`s as extra parameters.
 - The supported parameters types are: numeric, text, and boolean.

## Examples

Let's create a couple of examples based on existing analyses.

### Buffer

In the `buffer` analysis we want to include all existing columns but we want to expand the `the_geom` column with a
buffer in determined by an in meters `radius` param.

```sql
CREATE OR REPLACE FUNCTION DEP_EXT_buffer(
        operation text, table_name text, primary_source_query text, primary_source_columns text[], radius numeric
    )
    RETURNS VOID AS $$
        DECLARE selected_columns TEXT;
        BEGIN
            -- We want to drop original `the_geom` column as we are gonna return a different one.
            SELECT array_to_string(
              array_cat(
                array_remove(primary_source_columns, 'the_geom'),
                -- And we add our new `the_geom` column using the `radius` argument.
                ARRAY['ST_Buffer(the_geom::geography, $1)::geometry AS the_geom']
              ),
              ','
            ) INTO selected_columns;
            IF operation = 'create' THEN
                -- In some cases you might want to drop the table.
                -- EXECUTE 'DROP TABLE ' || table_name || ';';
                -- We use our prepared columns to select from the original query.
                EXECUTE format(
                    'CREATE TABLE %I AS SELECT %s FROM (%s) _q LIMIT 0',
                    table_name, selected_columns, primary_source_query
                ) USING radius;
            ELSIF operation = 'populate' THEN
                EXECUTE format(
                    'INSERT INTO %I SELECT %s FROM (%s) _q',
                    table_name, selected_columns, primary_source_query
                ) USING radius;
            END IF;
        END;
$$ LANGUAGE plpgsql;
```

The framework, behind the scenes, will call that function in two phases:

1. It call the new function with the `create` operation, so we can create a table, something like:

```sql
select * from DEP_EXT_buffer(
    'create',
    'wadus_table',
    'select 1 as cartodb_id, st_setsrid(st_makepoint(0,0), 4326) as the_geom',
    ARRAY['cartodb_id', 'the_geom'],
    1000
);
```

2. Later, it will invoke the same function but it will do it with `populate` as the operation to perform, like in:

```sql
select * from DEP_EXT_buffer(
    'populate',
    'wadus_table',
    'select 1 as cartodb_id, st_setsrid(st_makepoint(0,0), 4326) as the_geom',
    ARRAY['cartodb_id', 'the_geom'],
    1000
);
```

### Spatial Interpolation as in https://github.com/CartoDB/camshaft/pull/153

```sql
CREATE OR REPLACE FUNCTION DEP_EXT_SpatialInterpolation(
        operation text,
        table_name text,
        source_query text, source_columns text[],
        target_query text, target_columns text[],
        val_column text,
        method numeric, -- 0=nearest neighbor, 1=barymetric, 2=IDW
        number_of_neighbors numeric, -- DEFAULT 0, -- 0=unlimited
        decay_order numeric -- DEFAULT 0,
    )
    RETURNS VOID AS $$
        BEGIN
            IF method < 0 OR method > 2 THEN
                RAISE EXCEPTION 'Invalid method value=%', buster
                    USING HINT = 'Valid ones are: 0=nearest neighbor, 1=barymetric, 2=IDW';
            END IF;
            IF operation = 'create' THEN
                -- The table will have the schema of target query but with an extra column from the source query.
                EXECUTE format(
                    'CREATE TABLE %I AS SELECT _target.*, _source.%I FROM (%s) _target, (%s) _source LIMIT 0',
                    table_name, val_column, target_query, source_query
                );
            ELSIF operation = 'populate' THEN
                EXECUTE format($populate_query$
                    INSERT INTO %I
                    WITH
                    _target AS (%s),
                    _source AS (
                      SELECT array_agg(the_geom) as _geo,
                      array_agg( %I::numeric ) as _values
                      FROM (%s) _s
                      WHERE %I is not null
                    )
                    SELECT _target.*,
                      cdb_crankshaft.CDB_MockSpatialInterpolation(
                        _source._geo,
                        _source._values,
                        CASE WHEN GeometryType(_target.the_geom) = 'POINT' THEN _target.the_geom ELSE ST_Centroid(_target.the_geom) END,
                        $1,
                        $2,
                        $3
                      ) AS %I
                    FROM _target, _source
                    $populate_query$,
                    table_name, target_query, val_column, source_query, val_column, val_column
                ) USING method::int, number_of_neighbors, decay_order;
            END IF;
        END;
$$ LANGUAGE plpgsql;
```


## Query to retrieve metadata about compatible functions

To determine what functions are compatible with this analysis, it's possible to query the PostgreSQL catalog.

An example:

```sql
WITH dep_fns AS (
    SELECT oid, proname, proargnames, proargtypes FROM pg_catalog.pg_proc WHERE proname ~* '^dep_ext_'
),
fns_argstypes AS (SELECT oid, array_agg((
        SELECT
        CASE
            WHEN typcategory = 'A' THEN 'array'
            WHEN typcategory = 'N' THEN 'number'
            WHEN typcategory = 'S' THEN 'string'
            WHEN typcategory = 'B' THEN 'boolean'
        ELSE 'unknown' END
        FROM pg_catalog.pg_type
        WHERE argtype = pg_catalog.pg_type.oid
    )) as argtypes
    FROM (
        SELECT pg_proc.oid, unnest(pg_proc.proargtypes) as argtype
        FROM pg_catalog.pg_proc, dep_fns
        WHERE pg_proc.oid = dep_fns.oid
    ) _q
    group by oid
),
fns_meta AS (
    SELECT
        dep_fns.proname,
        dep_fns.proargnames,
        fns_argstypes.argtypes,
        CASE WHEN fns_argstypes.argtypes[6] = 'array' THEN
            -- [whether it has a secondary node or not, where the extra parameters start, where to stop]
            ARRAY[1,7,array_length(argtypes,1)]
        ELSE
            ARRAY[0,5,array_length(argtypes,1)]
        END as p
    FROM dep_fns, fns_argstypes
    WHERE dep_fns.oid = fns_argstypes.oid
)
SELECT
    proname as fn_name,
    proargnames[p[2]:p[3]] as params_names,
    argtypes[p[2]:p[3]] as params_types,
    p[1]::boolean as has_secondary_node
FROM fns_meta
```

It will return something like:

```
           fn_name            |                    params_names                     |         params_types          | has_secondary_node
------------------------------+-----------------------------------------------------+-------------------------------+--------------------
 dep_ext_buffer               | {radius}                                            | {number}                      | f
 dep_ext_spatialinterpolation | {val_column,method,number_of_neighbors,decay_order} | {string,number,number,number} | t
(2 rows)
```
