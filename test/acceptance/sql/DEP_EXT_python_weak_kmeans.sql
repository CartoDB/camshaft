DO $python$
BEGIN
    IF current_setting('server_version_num')::integer > 120000 THEN
        CREATE OR REPLACE FUNCTION DEP_EXT_python_weak_kmeans(
            operation text,
            table_name text,
            source_query text, source_columns text[],
            clusters int
        )
        RETURNS VOID AS
        $fdef$
            def my_poor_cluster_impl(row):
                # LOL.
                return int(max(0, (row['x'] / (360 / clusters) + (clusters / 2)) - 1))

            if operation == 'create':
                plpy.execute(
                    'CREATE TABLE {table_name} AS SELECT *, 0 as cluster_no FROM ({source_query}) _q LIMIT 0'
                    .format(table_name=table_name, source_query=source_query)
                )

            if operation == 'populate':
                # Populate the table with the original one.
                plpy.execute(
                    '''INSERT INTO {table_name} SELECT *, 0 as cluster_no FROM ({source_query}) _q'''
                    .format(table_name=table_name, source_query=source_query)
                )
                # Retrieve with some extra information based on st_x/st_y Postgis functions.
                # We already can work with the new table.
                rv = plpy.execute(
                    'select st_x(the_geom) x, st_y(the_geom) y, * FROM {table_name}'
                    .format(table_name=table_name)
                )
                plan = plpy.prepare(
                    'UPDATE {table_name} SET cluster_no = $1 WHERE cartodb_id = $2'.format(table_name=table_name),
                    ['numeric', 'numeric']
                )
                for row in rv:
                    cluster = my_poor_cluster_impl(row)
                    plpy.execute(plan, [cluster, row['cartodb_id']])
        $fdef$ LANGUAGE plpython3u;
    ELSE
        CREATE OR REPLACE FUNCTION DEP_EXT_python_weak_kmeans(
            operation text,
            table_name text,
            source_query text, source_columns text[],
            clusters int
        )
        RETURNS VOID AS
        $fdef$
            def my_poor_cluster_impl(row):
                # LOL.
                return int(max(0, (row['x'] / (360 / clusters) + (clusters / 2)) - 1))

            if operation == 'create':
                plpy.execute(
                    'CREATE TABLE {table_name} AS SELECT *, 0 as cluster_no FROM ({source_query}) _q LIMIT 0'
                    .format(table_name=table_name, source_query=source_query)
                )

            if operation == 'populate':
                # Populate the table with the original one.
                plpy.execute(
                    '''INSERT INTO {table_name} SELECT *, 0 as cluster_no FROM ({source_query}) _q'''
                    .format(table_name=table_name, source_query=source_query)
                )
                # Retrieve with some extra information based on st_x/st_y Postgis functions.
                # We already can work with the new table.
                rv = plpy.execute(
                    'select st_x(the_geom) x, st_y(the_geom) y, * FROM {table_name}'
                    .format(table_name=table_name)
                )
                plan = plpy.prepare(
                    'UPDATE {table_name} SET cluster_no = $1 WHERE cartodb_id = $2'.format(table_name=table_name),
                    ['numeric', 'numeric']
                )
                for row in rv:
                    cluster = my_poor_cluster_impl(row)
                    plpy.execute(plan, [cluster, row['cartodb_id']])
        $fdef$ LANGUAGE plpythonu;
    END IF;
END$python$;


