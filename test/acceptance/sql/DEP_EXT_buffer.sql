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
