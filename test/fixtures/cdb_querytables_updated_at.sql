CREATE OR REPLACE FUNCTION CDB_QueryTables_Updated_At(query text)
    RETURNS TABLE(dbname text, schema_name text, table_name text, updated_at timestamptz)
AS
$BODY$
DECLARE
    db_name text;
    schema_name text;
    table_name text[];
    updated_at timestamptz;
BEGIN
    db_name := 'analysis_api_test_db';
    schema_name := 'public';

    IF position('atm_machines' in query) > 0 THEN
        table_name := ARRAY['atm_machines']::text[];
    ELSIF position('multiple_tables' in query) > 0 THEN
        table_name := ARRAY['table_a', 'table_b']::text[];
    ELSE
        table_name := ARRAY['fixture_table_name']::text[];
    END IF;

    IF position('nulltime' in query) > 0 THEN
        updated_at := null::timestamptz;
    ELSE
        updated_at := '2016-07-01 11:40:05.699712+00'::timestamptz;
    END IF;

    RETURN QUERY EXECUTE 'SELECT $1, $2, unnest($3), $4' USING db_name, schema_name, table_name, updated_at;
END
$BODY$ LANGUAGE plpgsql;
