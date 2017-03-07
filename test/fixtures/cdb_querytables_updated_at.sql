CREATE OR REPLACE FUNCTION CDB_QueryTables_Updated_At(query text)
    RETURNS TABLE(dbname text, schema_name text, table_name text, updated_at timestamptz)
AS $$
    SELECT
    'analysis_api_test_db'::text,
    'public'::text,
    CASE WHEN position('atm_machines' in query) > 0 THEN 'atm_machines'::text
         WHEN position('multiple_tables' in query) > 0 THEN unnest(ARRAY['table_a', 'table_b']::text[])
         ELSE 'fixture_table_name'::text
    END,
    CASE WHEN position('nulltime' in query) > 0
        THEN null::timestamptz
        ELSE '2016-07-01 11:40:05.699712+00'::timestamptz
    END
$$ LANGUAGE SQL;
