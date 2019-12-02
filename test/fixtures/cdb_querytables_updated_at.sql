CREATE SCHEMA IF NOT EXISTS cartodb;
CREATE OR REPLACE FUNCTION cartodb.CDB_QueryTables_Updated_At(query text)
    RETURNS TABLE(dbname text, schema_name text, table_name text, updated_at timestamptz)
AS $$
    WITH query_tables AS (
        SELECT
            CASE WHEN position('atm_machines' in query) > 0 THEN ARRAY['atm_machines']::text[]
                 WHEN position('multiple_tables' in query) > 0 THEN ARRAY['table_a', 'table_b']::text[]
                 ELSE ARRAY['fixture_table_name']::text[]
            END
        AS table_names
    )
    SELECT
        'analysis_api_test_db'::text,
        'public'::text,
        unnest(table_names),
        CASE WHEN position('nulltime' in query) > 0
            THEN null::timestamptz
            ELSE '2016-07-01 11:40:05.699712+00'::timestamptz
        END
    FROM query_tables
$$ LANGUAGE SQL;
