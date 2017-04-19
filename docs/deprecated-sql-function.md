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
   * First argument: the operation to perform. Either `create` or `populate` the table.
   * Second argument: the name of the table to create or populate.
   * Third argument: a _free query_ from the primary source of the analysis.
   * Forth argument: an array of `text` listing all the columns from the _free query_ in the third argument.
   * Third, and consecutive arguments: it can receive an arbitrary number of `string`s and `number`s as extra arguments.
 - Functions might handle an optional signature where first, second, third and forth are the same as in the previous signature, but:
   * Fifth argument: a _free query_ from the secondary source of the analysis.
   * Sixth argument: an array of `text` listing all the columns from the _free query_ in the fifth argument.
   * Seventh, and consecutive arguments up to second-to-last: it can receive an arbitrary number of `string`s and `number`s as extra arguments.

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
                EXECUTE 'CREATE TABLE ' || table_name || ' AS ' ||
                    -- The table will have the schema of target query but with an extra column from the source query.
                    'SELECT _target.*, _source.' || val_column ||
                    ' FROM (' || target_query || ') _target, (' || source_query || ') _source LIMIT 0';
            ELSIF operation = 'populate' THEN
                EXECUTE 'INSERT INTO ' || table_name || ' ' ||
                    'WITH ' ||
                    '_target AS (' || target_query || '),' ||
                    '_source AS (' ||
                    '  SELECT array_agg(the_geom) as _geo,' ||
                    '  array_agg( ' || val_column || '::numeric ) as _values' ||
                    '  FROM (' || source_query || ') _s' ||
                    '  WHERE ' || val_column || ' is not null' ||
                    ')' ||
                    'SELECT _target.*,' ||
                    '  cdb_crankshaft.CDB_MockSpatialInterpolation(' ||
                    '    _source._geo,' ||
                    '    _source._values,' ||
                    '    CASE WHEN GeometryType(_target.the_geom) = ''POINT'' THEN _target.the_geom ELSE ST_Centroid(_target.the_geom) END,' ||
                    '    ' || method || ','
                    '    ' || number_of_neighbors || ','
                    '    ' || decay_order || ''
                    '  ) AS ' || val_column || ' '
                    'FROM _target, _source';
            END IF;
        END;
$$ LANGUAGE plpgsql;
```
